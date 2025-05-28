import { Equipo, GlobalConfig, Juez } from "../../types/types";
import { assignClassificatoryRaces } from "../assigners/assignClassificatoryRaces";
import { assignDescansos } from "../assigners/assignDescansos";
import { assignGlobalEvent } from "../assigners/assignGlobal";
import { assignPortfoliosAndVerbal } from "../assigners/assignPortfoliosAndVerbal";
import { assignSmallEvent } from "../assigners/assignSmallEvent";
import { generateDescansos } from "../generators/generateDescansos";
import { mins } from "../math/math";

// Helper to extract dynamic phase durations for desestructurado
function getDesestructuradoPhases(config: GlobalConfig): number[] {
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

// Pipeline scheduler for desestructurado (returns end date)
function assignDesestructuradoEscrutinio(
    teams: Equipo[],
    start: Date,
    end: Date,
    phaseDurations: number[],
    judgesCount: number
) {
    if (judgesCount !== phaseDurations.length) {
        throw new Error("Nº de Jueces para el escrutinio debe coincidir con nº de fases en desestructurado");
    }
    const nTeams = teams.length;
    let teamStartTimes: Date[] = [];
    let current = new Date(start);

    // Calcular el inicio de la fase 1 para cada equipo
    for (let i = 0; i < nTeams; i++) {
        teamStartTimes.push(new Date(current));
        // Siguiente equipo entra cuando el anterior termina la fase 1
        current = new Date(current.getTime() + phaseDurations[0] * 60000);
    }

    // Asignar las fases de escrutinio al horario de cada equipo
    for (let t = 0; t < nTeams; t++) {
        let phaseStart = new Date(teamStartTimes[t]);
        if (!Array.isArray((teams[t] as any).horario)) {
            (teams[t] as any).horario = [];
        }
        for (let p = 0; p < phaseDurations.length; p++) {
            const phaseEnd = new Date(phaseStart.getTime() + phaseDurations[p] * 60000);
            (teams[t] as any).horario.push({
                nombre: `Escrutinio Fase ${p + 1}`,
                fase: p + 1,
                tipo: "Concurrent Activity",
                start: new Date(phaseStart),
                end: new Date(phaseEnd),
                duracion: phaseDurations[p]
            });
            phaseStart = new Date(phaseEnd);
        }
    }

    // El evento termina cuando el último equipo termina su última fase
    let lastTeamEnd = new Date(teamStartTimes[nTeams - 1]);
    for (let p = 0; p < phaseDurations.length; p++) {
        lastTeamEnd = new Date(lastTeamEnd.getTime() + phaseDurations[p] * 60000);
    }
    if (lastTeamEnd > end) {
        throw new Error("No hay tiempo suficiente para completar todas las fases de escrutinio desestructurado");
    }
    return lastTeamEnd;
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
    const startPrices = new Date(
        windows[numOfDays - 1][1].getTime() - mins(90)
    );
    const descansos = generateDescansos(config);

    descansos.forEach(descanso => {
        assignGlobalEvent(descanso.name, descanso.start, descanso.duration, teams)
    });
    assignDescansos(windows, teams);

    const registroDurations = {
        Entry: config["Duración registro"],
        Development: config["Duración registro"],
        Professional: config["Duración registro"]
    };

    if (config["Dia de Escrutinio"]) {
        // =============== DAY 1: Registro & Escrutinio Only ==================
        const day1Start = windows[0][0];
        const day1End = windows[0][1];

        const endRegisterDate = assignSmallEvent(
            teams,
            day1Start,
            day1End,
            personelRegister,
            registroDurations,
            "Registro"
        );

        // Escrutinio Day: Use modal logic
        let endEscrutinio: Date;
        if (config["Modalidad de Escrutinio"] === "Desestructurado") {
            // Extract all phase durations dynamically
            const phases = getDesestructuradoPhases(config);
            endEscrutinio = assignDesestructuradoEscrutinio(
                teams,
                endRegisterDate,
                day1End,
                phases,
                judgesScrutiny.length
            );
        } else {
            // Original: Estructurado
            endEscrutinio = assignSmallEvent(
                teams,
                endRegisterDate,
                day1End,
                judgesScrutiny.length,
                {
                    Development: config["Duración Escrutinio Development"],
                    Entry: config["Duración Escrutinio Entry"],
                    Professional: config["Duración Escrutinio Professional"]
                },
                "Escrutinio",
                { Entry: 0 }
            );
        }

        // =============== DAY 2+: Charla, Pit Display, THEN Everything Else ===
        if (windows.length < 2) {
            throw new Error("Se requiere al menos dos días para Dia de Escrutinio.");
        }
        const day2Start = windows[1][0];

        // 1) Charla/Presentación
        const endCharla = assignGlobalEvent(
            "Charla/Presentación",
            day2Start,
            config["Duración Charla/Presentación"],
            teams
        );
        // 2) Pit Display
        const endPitDisplay = assignGlobalEvent(
            "Pit Display",
            endCharla,
            config["Duración Montaje del Pit Display"],
            teams
        );
        // 3) Classificatory races, portfolios, verbal PRESENTATIONS after Pit Display until 'startPrices'
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
        }, endPitDisplay, startPrices, config["Nº de carreras a la vez"]);

        try {
            assignPortfoliosAndVerbal(teams, endPitDisplay, startPrices, config, {
                verbal: judgesVerbal,
                empresa: judgesPortfolioEmpresa,
                scrutiny: judgesScrutiny,
                tecnico: judgesPortfolioTecnico
            })
        } catch (error) {
            console.error(error);
        }

        assignGlobalEvent(
            "Ceremonia de Clausura y Premios",
            startPrices,
            config["Duración Ceremonia de Clausura y Premios"],
            teams
        );

    } else {
        // =============== STANDARD MULTI-DAY (NO SCRUTINIO DAY) ==============
        const endRegisterDate = assignSmallEvent(
            teams,
            windows[0][0],
            startPrices,
            personelRegister,
            registroDurations,
            "Registro"
        );

        const endCharla = assignGlobalEvent(
            "Charla/Presentación",
            endRegisterDate,
            config["Duración Charla/Presentación"],
            teams
        );

        const endPitDisplay = assignGlobalEvent(
            "Pit Display",
            endCharla,
            config["Duración Montaje del Pit Display"],
            teams
        );

        // Escrutinio: modal logic here as well (optional, but for future-proofing)
        if (config["Modalidad de Escrutinio"] === "Desestructurado") {
            const phases = getDesestructuradoPhases(config);
            assignDesestructuradoEscrutinio(
                teams,
                endRegisterDate,
                startPrices,
                phases,
                judgesScrutiny.length
            );
        } else {
            assignSmallEvent(
                teams,
                endRegisterDate,
                startPrices,
                judgesScrutiny.length,
                {
                    Development: config["Duración Escrutinio Development"],
                    Entry: config["Duración Escrutinio Entry"],
                    Professional: config["Duración Escrutinio Professional"]
                },
                "Escrutinio",
                { Entry: 0 }
            );
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
        }, endPitDisplay, startPrices, config["Nº de carreras a la vez"]);

        try {
            assignPortfoliosAndVerbal(teams, endPitDisplay, startPrices, config, {
                verbal: judgesVerbal,
                empresa: judgesPortfolioEmpresa,
                scrutiny: judgesScrutiny,
                tecnico: judgesPortfolioTecnico
            })
        } catch (error) {
            console.error(error);
        }

        assignGlobalEvent(
            "Ceremonia de Clausura y Premios",
            startPrices,
            config["Duración Ceremonia de Clausura y Premios"],
            teams
        );
    }

    console.log(teams, "final");
};
