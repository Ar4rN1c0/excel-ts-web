import { Categoria, DurationsByCategory, Equipo, GlobalConfig, Juez } from "../../types/types";
import { assignClassificatoryRaces } from "../assigners/assignClassificatoryRaces";
import { assignDescansos } from "../assigners/assignDescansos";
import { assignGlobalEvent } from "../assigners/assignGlobal";
import { assignPortfoliosAndVerbal } from "../assigners/assignPortfoliosAndVerbal";
import { assignSmallEvent } from "../assigners/assignSmallEvent";
import { generateDescansos } from "../generators/generateDescansos";
import { mins } from "../math/math";
import { assignDesestructuradoPipelinedScrutiny } from "../assigners/assignDesestructuradoPipelinedScrutiny";
import { assignEstructuradoPipelinedScrutiny } from "../assigners/assignEstructuradoPipelinedScrutiny";

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

const CATS: Categoria[] = ["Entry", "Development", "Professional"];


function readPhaseDuration(config: GlobalConfig, cat: Categoria, phaseIdx1: number): number | undefined {
  // e.g. "Duración Escrutinio EntryFase 1"
  const dynKey = `Duración Escrutinio ${cat}Fase ${phaseIdx1}` as keyof GlobalConfig;
  const v = config[dynKey as any];
  if (typeof v === "number") return v;

  // fallback to static single duration per category (legacy)
  const staticKey = `Duración Escrutinio ${cat}` as keyof GlobalConfig;
  const s = config[staticKey as any];
  if (typeof s === "number") return s;

  return undefined;
}

function readNumPhases(config: GlobalConfig, cat: Categoria): number | undefined {
  const key = `Número de Fases ${cat}` as const;
  return config[key];
}

function buildDurationsByCategory(config: GlobalConfig): DurationsByCategory {
  const out: DurationsByCategory = {};
  for (const cat of CATS) {
    const n = readNumPhases(config, cat);
    if (!n || n <= 0) {
      // If you want to allow categories with 0 phases, skip instead of throwing:
      // continue;
      throw new Error(`Falta "Número de Fases ${cat}" o es inválido (>0).`);
    }
    const arr: number[] = [];
    for (let i = 1; i <= n; i++) {
      const d = readPhaseDuration(config, cat, i);
      if (!d || d <= 0) {
        throw new Error(`Falta duración para "${`Duración Escrutinio ${cat}Fase ${i}`}" y no hay fallback válido.`);
      }
      arr.push(d);
    }
    out[cat] = arr;
  }
  return out;
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
    assignDesestructuradoPipelinedScrutiny(
      teams,
      startTimes,
      hardEnd,
      judgesScrutiny.length,
      {
        Development: config["Duración Escrutinio Development"],
        Entry: config["Duración Escrutinio Entry"],
        Professional: config["Duración Escrutinio Professional"],
      }
    );
    return;
  }

  // === Estructurado ===
  const durationsByCategory = buildDurationsByCategory(config); // your existing helper

  // ✅ Lanes = max nº de fases entre categorías (NOT sum)
  const laneCount =
    Math.max(
      (durationsByCategory.Entry ?? durationsByCategory.entry ?? []).length,
      (durationsByCategory.Development ?? durationsByCategory.development ?? []).length,
      (durationsByCategory.Professional ?? durationsByCategory.professional ?? []).length
    );

  const numJudges = judgesScrutiny.length;

  if (numJudges !== laneCount) {
    throw new Error(
      `Nº de Jueces para el escrutinio (${numJudges}) debe coincidir con ` +
      `las fases a la vez (${laneCount} = máximo nº de fases entre categorías).`
    );
  }

  // Also ensure no category needs more phases than lanes (defensive)
  for (const cat of ["Entry", "Development", "Professional"] as const) {
    const n = (durationsByCategory[cat] ?? (durationsByCategory as any)[cat.toLowerCase()] ?? []).length;
    if (n > numJudges) {
      throw new Error(`La categoría ${cat} requiere ${n} fases pero solo hay ${numJudges} jueces.`);
    }
  }

  assignEstructuradoPipelinedScrutiny(
    teams,
    startTimes,
    hardEnd,
    durationsByCategory,
    numJudges // <<< pass judges as the number of global lanes
  );
}


/** Everything that happens after Pit Display and before the ceremony (races, portfolios, verbal) */
/** NOTE: ceremony & knockouts are now pre-scheduled elsewhere; this function no longer places them. */
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
  _ceremonyDuration: number // kept to avoid changing call sites; unused now
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

  // Dejamos que los detectores de colisión existentes actúen si algo intenta pasarse
  // del inicio de Knockouts o la Ceremonia (ya pre-colocadas).
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

  // ---- Pre-colocar Ceremonia al final y Knockouts justo antes ----
  const ceremonyStart = getCeremonyStart(windows, numOfDays, ceremonyDuration);

  // Ceremonia al final del último día
  assignGlobalEvent("Ceremonia de Clausura y Premios", ceremonyStart, ceremonyDuration, teams);

  // Knockouts inmediatamente antes de la ceremonia
  const knockoutsDuration = config["Duración Knockouts - Eliminatorias"];
  const knockoutsStart = new Date(ceremonyStart.getTime() - mins(knockoutsDuration));
  assignGlobalEvent("Knockouts - Eliminatorias", knockoutsStart, knockoutsDuration, teams);

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
      // seguimos usando ceremonyStart como límite alto; los bloqueos globales ya están puestos
      ceremonyStart,
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

    // Escrutinio en paralelo al resto (hasta la ceremonia; choques con Knockouts/Ceremonia
    // serán detectados por los validadores existentes)
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
