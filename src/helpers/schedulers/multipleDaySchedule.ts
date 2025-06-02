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

function getEstructuradoPhases(config: GlobalConfig): number[] {
    const phaseDurations: number[] = [];
    let phase = 1;
    while (true) {
        const key = `Duración Escrutinio Fase ${phase}` as keyof GlobalConfig;
        if (typeof config[key] !== "number") break;
        phaseDurations.push(config[key] as number);
        phase++;
    }
    return phaseDurations;
}

export const multipleDaySchedule = (
    teams: Equipo[],
    windows: Date[][],
    judgesVerbal: Juez[],
    judgesScrutiny: Juez[],
    judgesPortfolioEmpresa: Juez[],
    judgesPortfolioTecnico: Juez[],
    personelRegister: number,
    config: GlobalConfig
) => {
    const numOfDays = config.NumberOfDays;
    const ceremonyDuration = config["Duración Ceremonia de Clausura y Premios"];
    const ceremonyStart = new Date(windows[numOfDays - 1][1].getTime() - mins(ceremonyDuration));
    // Removed unused ceremonyEnd variable

    // --- Descansos assignment ---
    const descansos = generateDescansos(config);
    descansos.forEach(descanso => {
        assignGlobalEvent(descanso.name, descanso.start, descanso.duration, teams)
    });
    assignDescansos(windows, teams);

    // Registro
    const registroDurations = {
        Entry: config["Duración registro"],
        Development: config["Duración registro"],
        Professional: config["Duración registro"]
    };

    if (config["Dia de Escrutinio"]) {
        // ========================== CON DÍA DE ESCRUTINIO ==========================
        const day1Start = windows[0][0];
        const day1End = windows[0][1];

        assignSmallEvent(
            teams,
            day1Start,
            day1End,
            personelRegister,
            registroDurations,
            "Registro"
        );
        const registerEnds: Date[] = teams.map(
            t => ((t as any).horario.find((e: any) => e.nombre === "Registro")?.end)
        );

        if (config["Modalidad de Escrutinio"] === "Desestructurado") {
            assignDesestructuradoPipelinedScrutiny(
                teams,
                registerEnds,
                day1End,
                judgesScrutiny.length,
                {
                    Development: config["Duración Escrutinio Development"],
                    Entry: config["Duración Escrutinio Entry"],
                    Professional: config["Duración Escrutinio Professional"]
                }
            );
        } else {
            // Estructurado
            const phases = getEstructuradoPhases(config);
            if (phases.length !== judgesScrutiny.length) {
                throw new Error("Nº de Jueces para el escrutinio debe coincidir con nº de fases en estructurado");
            }
            assignEstructuradoPipelinedScrutiny(
                teams,
                registerEnds,
                day1End,
                phases
            );
        }

        // SIGUIENTE DÍA: charla, pit display, todo lo demás
        if (windows.length < 2) {
            throw new Error("Se requiere al menos dos días para Dia de Escrutinio.");
        }

        const nextDayStart = windows[1][0];

        const endCharla = assignGlobalEvent(
            "Charla/Presentación",
            nextDayStart,
            config["Duración Charla/Presentación"],
            teams
        );
        const endPitDisplay = assignGlobalEvent(
            "Pit Display",
            endCharla,
            config["Duración Montaje del Pit Display"],
            teams
        );

        const actividadesStart = endPitDisplay;
        const actividadesEnd = ceremonyStart;

        if (actividadesStart >= actividadesEnd) {
            throw new Error("No hay hueco suficiente para carreras, portfolios y presentaciones entre el Pit Display y la Ceremonia.");
        }

        assignClassificatoryRaces(teams, {
            duration: {
                Entry: config["Duración Carrera Entry"],
                Development: config["Duración Carrera Development"],
                Professional: config["Duración Carrera Professional"]
            },
            heatsPerCategory: {
                Entry: { max: config["Carreras Entry"], min: config["Carreras Entry"] },
                Development: { max: 2, min: 2 },
                Professional: { max: 2, min: 2 }
            },
        }, actividadesStart, actividadesEnd, config["Nº de carreras a la vez"]);

        assignPortfoliosAndVerbal(teams, actividadesStart, actividadesEnd, config, {
            verbal: judgesVerbal,
            empresa: judgesPortfolioEmpresa,
            scrutiny: judgesScrutiny,
            tecnico: judgesPortfolioTecnico
        });

        // ========== Añadir "Cómputo de Puntos" justo antes de la ceremonia ==========
        const lastEnd = getLastEventEndBeforeCeremony(teams);
        const puntoDuration = config["Duración Cómputo de Puntos"];
        assignGlobalEvent(
            "Cómputo de Puntos",
            lastEnd,
            puntoDuration,
            teams
        );

        // Ceremonia de Clausura y Premios
        assignGlobalEvent(
            "Ceremonia de Clausura y Premios",
            ceremonyStart,
            ceremonyDuration,
            teams
        );
    } else {
        // ========================== SIN DÍA DE ESCRUTINIO ==========================
        const regStart = windows[0][0];
        const regEnd = windows[0][1];
        assignSmallEvent(
            teams,
            regStart,
            regEnd,
            personelRegister,
            registroDurations,
            "Registro"
        );
        const registerEnds: Date[] = teams.map(
            t => ((t as any).horario.find((e: any) => e.nombre === "Registro")?.end)
        );

        // Charla y pit display justo tras registro (el máximo de los registros)
        const charlaStart = new Date(Math.max(...registerEnds.map(d => d.getTime())));
        const endCharla = assignGlobalEvent(
            "Charla/Presentación",
            charlaStart,
            config["Duración Charla/Presentación"],
            teams
        );
        const endPitDisplay = assignGlobalEvent(
            "Pit Display",
            endCharla,
            config["Duración Montaje del Pit Display"],
            teams
        );

        // -- El resto (scrutinio, carreras, portfolios, verbal) se puede asignar en paralelo --
        // Scrutinio
        if (config["Modalidad de Escrutinio"] === "Desestructurado") {
            assignDesestructuradoPipelinedScrutiny(
                teams,
                Array(teams.length).fill(endPitDisplay),
                ceremonyStart,
                judgesScrutiny.length,
                {
                    Development: config["Duración Escrutinio Development"],
                    Entry: config["Duración Escrutinio Entry"],
                    Professional: config["Duración Escrutinio Professional"]
                }
            );
        } else {
            // Estructurado
            const phases = getEstructuradoPhases(config);
            if (phases.length !== judgesScrutiny.length) {
                throw new Error("Nº de Jueces para el escrutinio debe coincidir con nº de fases en estructurado");
            }
            assignEstructuradoPipelinedScrutiny(
                teams,
                Array(teams.length).fill(endPitDisplay),
                ceremonyStart,
                phases
            );
        }

        const actividadesStart = endPitDisplay;
        const actividadesEnd = ceremonyStart;

        assignClassificatoryRaces(teams, {
            duration: {
                Entry: config["Duración Carrera Entry"],
                Development: config["Duración Carrera Development"],
                Professional: config["Duración Carrera Professional"]
            },
            heatsPerCategory: {
                Entry: { max: config["Carreras Entry"], min: config["Carreras Entry"] },
                Development: { max: 2, min: 2 },
                Professional: { max: 2, min: 2 }
            },
        }, actividadesStart, actividadesEnd, config["Nº de carreras a la vez"]);

        assignPortfoliosAndVerbal(teams, actividadesStart, actividadesEnd, config, {
            verbal: judgesVerbal,
            empresa: judgesPortfolioEmpresa,
            scrutiny: judgesScrutiny,
            tecnico: judgesPortfolioTecnico
        });

        // ========== Añadir "Cómputo de Puntos" justo antes de la ceremonia ==========
        const lastEnd = getLastEventEndBeforeCeremony(teams);
        const puntoDuration = config["Duración Cómputo de Puntos"];
        assignGlobalEvent(
            "Cómputo de Puntos",
            lastEnd,
            puntoDuration,
            teams
        );

        // Ceremonia de Clausura y Premios
        assignGlobalEvent(
            "Ceremonia de Clausura y Premios",
            ceremonyStart,
            ceremonyDuration,
            teams
        );
    }
    // --- FINAL: LOGGING PARA DEPURACIÓN --- (REMOVED)
};
