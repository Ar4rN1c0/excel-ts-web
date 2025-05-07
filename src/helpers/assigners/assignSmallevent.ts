import { DurationMap, Equipo, Evento } from "../../types/types";
import { checkConcurrency, getAvailableWindows } from "../math";

export const assignSmallEvent = (
    teams: Equipo[],
    startDate: Date,
    endDate: Date,
    maxJudges: number,
    durationMap: DurationMap,
    eventName: string
): Date => {
    const globalEvents: Evento[] = [];

    // Filter out teams with 0 duration for their category
    const filteredTeams = teams.filter(team => durationMap[team.categoria] > 0);

    // Sort remaining teams by number of available windows (fewest first)
    const sortedTeams = [...filteredTeams].sort((a, b) => {
        const aVentanas = getAvailableWindows(startDate, endDate, a.horario, durationMap[a.categoria]).length;
        const bVentanas = getAvailableWindows(startDate, endDate, b.horario, durationMap[b.categoria]).length;
        return aVentanas - bVentanas;
    });

    // Assign event to each team
    for (const team of sortedTeams) {
        const duration = durationMap[team.categoria];
        const agenda = [...team.horario].filter(e => e.end > startDate && e.start < endDate);

        const posiblesVentanas = getAvailableWindows(startDate, endDate, agenda, duration);
        let assigned = false;

        for (const [candidateStart, candidateEnd] of posiblesVentanas) {
            const event: Evento = {
                nombre: eventName,
                duracion: duration,
                start: candidateStart,
                end: candidateEnd,
                tipo: "Concurrent Activity"
            };

            if (checkConcurrency(globalEvents, event, maxJudges)) {
                team.horario.push(event);
                globalEvents.push(event);
                assigned = true;
                break;
            }
        }

        if (!assigned) {
            throw new Error(`No hay espacio disponible para ${team.nombre} antes de la ceremonia de clausura.`);
        }
    }

    return new Date(Math.max(...globalEvents.map(e => e.end.getTime())));
};