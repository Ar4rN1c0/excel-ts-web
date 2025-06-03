import { hasCollision } from "../math/check";
import { getAvailableWindows } from "../math/windows";
import { Equipo, Evento } from "../../types/types";

/**
 * Asigna escrutinio desestructurado: cada equipo pasa por N fases, pipelined.
 * Cada fase tiene concurrencia máxima de 1, pero la asignación busca huecos
 * para evitar colisiones con el propio horario y espera si hay eventos previos.
 */
export function assignEstructuradoPipelinedScrutiny(
    teams: Equipo[],
    startTimes: Date[],
    end: Date,
    phasesDurations: number[]
): Date[] {
    const nPhases = phasesDurations.length;
    const phaseGlobalEvents: Evento[][] = Array.from({ length: nPhases }, () => []);
    const endTimes: Date[] = [];
    const order = startTimes
        .map((d, i) => ({ idx: i, time: d }))
        .sort((a, b) => a.time.getTime() - b.time.getTime())
        .map(e => e.idx);

    for (const teamIdx of order) {
        const team = teams[teamIdx];
        let prevPhaseEnd = startTimes[teamIdx];
        (team as any).horario = (team as any).horario || [];

        for (let phase = 0; phase < nPhases; phase++) {
            const duration = phasesDurations[phase];
            const personalSchedule = (team as any).horario;
            const globalSchedule = phaseGlobalEvents[phase];

            // 1. Get all windows where the TEAM is available (excluding global phase events)
            const teamWindows = getAvailableWindows(
                prevPhaseEnd,
                end,
                personalSchedule,
                duration
            );

            let assigned = false;
            // 2. For each available team window, check if it collides with global phase events
            for (const [windowStart, windowEnd] of teamWindows) {
                // Create the candidate event for this phase
                const candidateEvent: Evento = {
                    nombre: `Escrutinio Fase ${phase + 1}`,
                    tipo: "Concurrent Activity",
                    start: windowStart,
                    end: windowEnd,
                    duracion: duration
                };
                // Only assign if the phase is also available globally (no other team there)
                if (!hasCollision(globalSchedule, candidateEvent, 1)) {
                    // Assign to team's schedule and global phase schedule
                    (team as any).horario.push(candidateEvent);
                    globalSchedule.push(candidateEvent);
                    prevPhaseEnd = windowEnd;
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                throw new Error(
                  `No hay ventana disponible para el equipo ${team.nombre} en la fase ${phase + 1}`
                );
            }
        }
        endTimes[teamIdx] = prevPhaseEnd;
    }
    return endTimes;
}
