import { hasCollision } from "../math/check";
import { getAvailableWindows } from "../math/windows";
import { Equipo, Evento } from "../../types/types";

/**
 * Asigna escrutinio desestructurado: cada equipo pasa por N fases, pipelined.
 * Cada fase tiene concurrencia máxima de 1, pero la asignación busca huecos
 * para evitar colisiones con el propio horario.
 */
export function assignEstructuradoPipelinedScrutiny(
    teams: Equipo[],
    startTimes: Date[],
    end: Date,
    phasesDurations: number[]
): Date[] {
    const nPhases = phasesDurations.length;

    // Para cada fase, agenda global (eventos ya asignados en esa fase)
    const phaseGlobalEvents: Evento[][] = Array.from({ length: nPhases }, () => []);

    // Para cada equipo, su última fecha asignada (para devolver)
    const endTimes: Date[] = [];

    // Orden por cuando terminan inscripción (puedes cambiar por prioridad si lo deseas)
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
            // El intervalo posible es [prevPhaseEnd, end]
            // Buscar huecos usando eventos propios y la agenda global de la fase
            const personalSchedule = (team as any).horario;
            const globalSchedule = phaseGlobalEvents[phase];

            // Solo checar huecos que empiezan después de prevPhaseEnd
            const windows = getAvailableWindows(
                prevPhaseEnd,
                end,
                personalSchedule.concat(globalSchedule),
                duration
            );

            // Solo toma el primer hueco libre, si lo hay
            let assigned = false;
            for (const [candidateStart, candidateEnd] of windows) {
                const event: Evento = {
                    nombre: `Escrutinio Fase ${phase + 1}`,
                    tipo: "Concurrent Activity",
                    start: candidateStart,
                    end: candidateEnd,
                    duracion: duration
                };
                // Verificamos solo colisión en la fase (concurrencia 1)
                if (!hasCollision(globalSchedule, event, 1)) {
                    // Asignar a horario y a la agenda global de la fase
                    (team as any).horario.push(event);
                    phaseGlobalEvents[phase].push(event);
                    prevPhaseEnd = candidateEnd;
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
