import { Equipo, GlobalConfig } from "../../types/types";
import { assignGlobalEvent } from "../assigners/assignGlobal";
import { assignSmallEvent } from "../assigners/assignSmallEvent";
import { assignClassificatoryRaces } from "../assigners/assignClassificatoryRaces";
import { generateDescansos } from "../generators/generateDescansos";

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

export const calculateTime = (teams: Equipo[], config: GlobalConfig): number => {
    // Use a dummy far future end date
    const startDate = new Date(2000, 0, 1, 8, 0, 0, 0);
    const endDate = new Date(2000, 0, 9, 8, 0, 0, 0);

    // Reset team schedules (if needed)
    teams.forEach(t => t.horario = []);
    const descansos = generateDescansos(config)
    descansos.forEach(descanso => assignGlobalEvent(descanso.name, descanso.start, descanso.duration, teams))

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

    // ... (add all other assigners here, e.g. portfolios, verball, etc.)

    // Ceremonia de Clausura
    const latestEnd = findLatestEnd(teams);
    const cierreStart = latestEnd;
    assignGlobalEvent(
        "Ceremonia de Clausura y Premios",
        cierreStart,
        config["Duración Ceremonia de Clausura y Premios"],
        teams
    );

    // Find latest event end among all teams
    const finalEnd = findLatestEnd(teams);

    // Calculate duration in minutes
    const durationMinutes = Math.round((finalEnd.getTime() - startDate.getTime()) / (1000 * 60));

    return durationMinutes;
};
