import { Equipo, GlobalConfig } from "../../types/types";
import { assignGlobalEvent } from "../assigners/assignGlobal";
import { assignSmallEvent } from "../assigners/assignSmallEvent";
import { assignClassificatoryRaces } from "../assigners/assignClassificatoryRaces";
import { Descanso, generateDescansos } from "../generators/generateDescansos";

// Utility: Find latest end date from all events
function findLatestEnd(teams: Equipo[]): Date {
    let latest = new Date(0);
    for (const team of teams) {
        for (const event of team.horario) {
            if (event.end > latest) latest = event.end;
        }
    }
    return latest;
}

/**
 * Maps each descanso from its real timeline to the test timeline,
 * preserving the relative distance from the real event's start date.
 * @param descansos Original descansos, with their original .start times
 * @param realStart The real Dia 1 Start (Date object)
 * @param testStart The test schedule's starting point (Date object)
 */
function normalizeDescansosLinear(
    descansos: Descanso[],
    realStart: Date,
    testStart: Date
): Descanso[] {
    const delta = testStart.getTime() - realStart.getTime();
    return descansos.map(descanso => ({
        ...descanso,
        start: new Date(descanso.start.getTime() + delta)
    }));
}

export const calculateTime = (teams: Equipo[], config: GlobalConfig): number => {
    // Simulated schedule range
    const startDate = new Date(2000, 0, 1, 8, 0, 0, 0);
    const endDate = new Date(2000, 0, 9, 8, 0, 0, 0);   

    // Real Dia 1 Start, from config
    const dia1StartStr = config["Dia 1 Start"];
    if (!dia1StartStr) {
        throw new Error("Missing required config: Dia 1 Start");
    }
    const day1StartDate = new Date(dia1StartStr);

    // Reset all team schedules
    teams.forEach(t => t.horario = []);

    // Generate descansos based on config, then normalize them linearly to the test timeline
    const descansos = generateDescansos(config);
    const normalizedDescansos = normalizeDescansosLinear(descansos, day1StartDate, startDate);

    // Assign descansos as global events
    normalizedDescansos.forEach(descanso =>
        assignGlobalEvent(descanso.name, descanso.start, descanso.duration, teams)
    );

    // === SCHEDULING LOGIC ===
    const registroDurations = {
        Entry: 5,
        Development: 5,
        Professional: 5
    };

    const endRegisterDate = assignSmallEvent(
        teams,
        startDate,
        endDate,
        config["Nº de personal para el registro"],
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

    assignSmallEvent(
        teams,
        endPitDisplay,
        endDate,
        config["Nº de Jueces para el escrutinio"],
        {
            Development: config["Duración Escrutinio Development"],
            Entry: config["Duración Escrutinio Entry"],
            Professional: config["Duración Escrutinio Professional"]
        },
        "Escrutinio",
        { Entry: 0 }
    );

    assignClassificatoryRaces(
        teams,
        {
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
        },
        endPitDisplay,
        endDate,
        config["Nº de carreras a la vez"]
    );

    // ... (other assigners: portfolios, verbal, eliminatorias, etc.)

    // Ceremonia de Clausura
    const latestEnd = findLatestEnd(teams);
    assignGlobalEvent(
        "Ceremonia de Clausura y Premios",
        latestEnd,
        config["Duración Ceremonia de Clausura y Premios"],
        teams
    );

    // Find latest event end among all teams for total duration calculation
    const finalEnd = findLatestEnd(teams);
    for (const team of teams) {
        for (const event of team.horario) {
            console.log(`Team: ${team.nombre}, Event: ${event.nombre}, Start: ${event.start}, End: ${event.end}`);
        }
    }

    // Calculate duration in minutes (total elapsed time from test start to last event)
    const durationMinutes = Math.round((finalEnd.getTime() - startDate.getTime()) / (1000 * 60));
    return durationMinutes;
};


export function getLastEventEndBeforeCeremony(teams: Equipo[]): Date {
    let lastEnd: Date | null = null;
    for (const team of teams) {
        for (const event of (team as any).horario || []) {
            if (event.nombre === "Ceremonia de Clausura y Premios") continue;
            if (!lastEnd || event.end > lastEnd) lastEnd = event.end;
        }
    }
    if (!lastEnd) throw new Error("No events found before ceremony");
    return lastEnd;
}
