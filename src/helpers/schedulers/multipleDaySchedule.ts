import { Equipo, GlobalConfig, Juez } from "../../types/types";
import { assignClassificatoryRaces } from "../assigners/assignClassificatoryRaces";
import { assignDescansos } from "../assigners/assignDescansos";
import { assignGlobalEvent } from "../assigners/assignGlobal";
import { assignPortfoliosAndVerbal } from "../assigners/assignPortfoliosAndVerbal";
import { assignSmallEvent } from "../assigners/assignSmallEvent";
import { generateDescansos } from "../generators/generateDescansos";
import { mins } from "../math/math";
import { getLastEventEndBeforeCeremony } from "../math/calculateTime";
import { assignDesestructuradoPipelinedScrutiny } from "../assigners/assignDesestructuradoPipelinedScrutiny";
import { assignEstructuradoPipelinedScrutiny } from "../assigners/assignEstructuradoPipelinedScrutiny";

/** Read phases: Duración Escrutinio Fase 1..N from config */
function getEstructuradoPhases(config: GlobalConfig): number[] {
  const durations: number[] = [];
  for (let i = 1; ; i++) {
    const key = `Duración Escrutinio Fase ${i}` as keyof GlobalConfig;
    if (typeof config[key] !== "number") break;
    durations.push(config[key] as number);
  }
  return durations;
}

function getCeremonyStart(windows: Date[][], numOfDays: number, ceremonyMinutes: number): Date {
  const endOfLastDay = windows[numOfDays - 1]?.[1];
  if (!endOfLastDay) throw new Error("Ventanas de tiempo inválidas: falta el fin del último día.");
  return new Date(endOfLastDay.getTime() - mins(ceremonyMinutes));
}

function assignGeneratedDescansos(config: GlobalConfig, teams: Equipo[]) {
  const descansos = generateDescansos(config);
  descansos.forEach(d => assignGlobalEvent(d.name, d.start, d.duration, teams));
}

function registrationDurations(config: GlobalConfig) {
  const d = config["Duración registro"];
  return { Entry: d, Development: d, Professional: d };
}

function raceDurations(config: GlobalConfig) {
  return {
    Entry: config["Duración Carrera Entry"],
    Development: config["Duración Carrera Development"],
    Professional: config["Duración Carrera Professional"],
  };
}

function heatsPerCategory(config: GlobalConfig) {
  return {
    Entry: { max: config["Carreras Entry"], min: config["Carreras Entry"] },
    Development: { max: config["Carreras Development"], min: config["Carreras Development"] },
    Professional: { max: config["Carreras Professional"], min: config["Carreras Professional"] },
  };
}

/** Assign scrutiny according to modality */
function assignScrutiny(
  modality: GlobalConfig["Modalidad de Escrutinio"],
  teams: Equipo[],
  startTimes: Date[],
  hardEnd: Date,
  judgesScrutiny: Juez[],
  config: GlobalConfig
) {
  if (modality === "Desestructurado") {
    assignDesestructuradoPipelinedScrutiny(teams, startTimes, hardEnd, judgesScrutiny.length, {
      Development: config["Duración Escrutinio Development"],
      Entry: config["Duración Escrutinio Entry"],
      Professional: config["Duración Escrutinio Professional"],
    });
    return;
  }

  // Estructurado
  const phases = getEstructuradoPhases(config);
  if (phases.length !== judgesScrutiny.length) {
    throw new Error(
      "Nº de Jueces para el escrutinio debe coincidir con nº de fases en estructurado"
    );
  }
  assignEstructuradoPipelinedScrutiny(teams, startTimes, hardEnd, phases);
}

/** Everything that happens after Pit Display and before the ceremony (races, portfolios, verbal, points, ceremony) */
function assignActivitiesAndCeremony(
  teams: Equipo[],
  actividadesStart: Date,
  ceremonyStart: Date,
  config: GlobalConfig,
  judges: {
    verbal: Juez[];
    empresa: Juez[];
    scrutiny: Juez[];
    tecnico: Juez[];
  },
  numParallelRaces: number,
  ceremonyDuration: number
) {
  if (actividadesStart >= ceremonyStart) {
    throw new Error(
      "No hay hueco suficiente para carreras, portfolios y presentaciones entre el Pit Display y la Ceremonia."
    );
  }

  assignClassificatoryRaces(
    teams,
    {
      duration: raceDurations(config),
      heatsPerCategory: heatsPerCategory(config),
    },
    actividadesStart,
    ceremonyStart,
    numParallelRaces
  );  

  assignPortfoliosAndVerbal(teams, actividadesStart, ceremonyStart, config, judges);

  // Knockouts - Eliminatorias (justo antes de la ceremonia)
  const lastEnd = getLastEventEndBeforeCeremony(teams);
  assignGlobalEvent("Knockouts - Eliminatorias", lastEnd, config["Duración Knockouts - Eliminatorias"], teams);

  // Ceremonia
  assignGlobalEvent("Ceremonia de Clausura y Premios", ceremonyStart, ceremonyDuration, teams);
}

export function multipleDaySchedule(
  teams: Equipo[],
  windows: Date[][],
  judgesVerbal: Juez[],
  judgesScrutiny: Juez[],
  judgesPortfolioEmpresa: Juez[],
  judgesPortfolioTecnico: Juez[],
  personelRegister: number,
  config: GlobalConfig
): void {
  // ---- Validaciones base ----
  const numOfDays = config.NumberOfDays;
  if (!Number.isInteger(numOfDays) || numOfDays < 1) {
    throw new Error("NumberOfDays inválido en config.");
  }
  if (windows.length < numOfDays) {
    throw new Error("No hay suficientes ventanas de tiempo para NumberOfDays.");
  }

  const ceremonyDuration = config["Duración Ceremonia de Clausura y Premios"];
  const ceremonyStart = getCeremonyStart(windows, numOfDays, ceremonyDuration);

  // ---- Descansos ----
  assignGeneratedDescansos(config, teams);
  assignDescansos(windows, teams);

  // ---- Registro ----
  const regDurations = registrationDurations(config);

  if (config["Dia de Escrutinio"]) {
    // ======= Día 1: Registro + Escrutinio =======
    const [day1Start, day1End] = windows[0];

    assignSmallEvent(teams, day1Start, day1End, personelRegister, regDurations, "Registro");
    const registerEnds: Date[] = teams.map(
      team => team.horario.find(event => event.nombre === "Registro")?.end
    ) as Date[];
    assignScrutiny(
      config["Modalidad de Escrutinio"],
      teams,
      registerEnds,
      day1End,
      judgesScrutiny,
      config
    );

    // ======= Día siguiente: Charla + Pit + resto =======
    if (windows.length < 2) {
      throw new Error("Se requiere al menos dos días para Dia de Escrutinio.");
    }

    const nextDayStart = windows[1][0];

    const charlaEnd = assignGlobalEvent(
      "Charla/Presentación",
      nextDayStart,
      config["Duración Charla/Presentación"],
      teams
    );
    const pitEnd = assignGlobalEvent(
      "Pit Display",
      charlaEnd,
      config["Duración Montaje del Pit Display"],
      teams
    );

    assignActivitiesAndCeremony(
      teams,
      pitEnd,
      ceremonyStart,
      config,
      {
        verbal: judgesVerbal,
        empresa: judgesPortfolioEmpresa,
        scrutiny: judgesScrutiny,
        tecnico: judgesPortfolioTecnico,
      },
      config["Nº de carreras a la vez"],
      ceremonyDuration
    );
  } else {
    // ======= Sin día específico de escrutinio =======
    const [regStart, regEnd] = windows[0];

    assignSmallEvent(teams, regStart, regEnd, personelRegister, regDurations, "Registro");

    const registerEnds: Date[] = teams.map(
      t => (t as any).horario.find((e: any) => e.nombre === "Registro")?.end
    );

    // Charla + Pit inmediatamente tras el último registro
    const charlaStart = new Date(Math.max(...registerEnds.map(d => d.getTime())));
    const charlaEnd = assignGlobalEvent(
      "Charla/Presentación",
      charlaStart,
      config["Duración Charla/Presentación"],
      teams
    );
    const pitEnd = assignGlobalEvent(
      "Pit Display",
      charlaEnd,
      config["Duración Montaje del Pit Display"],
      teams
    );

    // Escrutinio en paralelo al resto
    assignScrutiny(
      config["Modalidad de Escrutinio"],
      teams,
      Array(teams.length).fill(pitEnd),
      ceremonyStart,
      judgesScrutiny,
      config
    );

    assignActivitiesAndCeremony(
      teams,
      pitEnd,
      ceremonyStart,
      config,
      {
        verbal: judgesVerbal,
        empresa: judgesPortfolioEmpresa,
        scrutiny: judgesScrutiny,
        tecnico: judgesPortfolioTecnico,
      },
      config["Nº de carreras a la vez"],
      ceremonyDuration
    );
  }
}
