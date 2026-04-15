import { Equipo, Evento } from "../../types/types";
import { hasCollision } from "../math/check";
import { getAvailableWindows } from "../math/windows";

/**
 * Assigns escrutinio to teams as soon as they finish register and a judge is free,
 * waiting if needed for team events to finish.
 */
export function assignDesestructuradoPipelinedScrutiny(
    teams: Equipo[],
    startTimes: Date[],
    end: Date,
    judgeCount: number,
    durationsByCategory: { [key: string]: number }
): Date[] {
    // For each judge, store when they are next available
    const judgeNextFree: Date[] = new Array(judgeCount)
        .fill(new Date(Math.min(...startTimes.map(d => d.getTime()))));
    
    // Order teams by their registration end time
    const order = startTimes
        .map((d, i) => ({ idx: i, time: d }))
        .sort((a, b) => a.time.getTime() - b.time.getTime())
        .map(e => e.idx);

    const escrutinioEndTimes: Date[] = [];
    for (const teamIdx of order) {
        const team = teams[teamIdx];
        const readyAt = startTimes[teamIdx];
        const duration = durationsByCategory[team.categoria];
        const horarioActual: Evento[] = (team as any).horario || [];

        // Find all windows when the team is available (after readyAt, before end)
        const windows = getAvailableWindows(readyAt, end, horarioActual, duration);

        let assigned = false;

        for (const [windowStart, windowEnd] of windows) {
            // For this window, check when a judge is free
            // The judge must be free *before* or at windowStart
            let soonestJudgeIdx = -1;
            let soonestJudgeFree: Date | null = null;
            for (let j = 0; j < judgeCount; j++) {
                // Judge can be free before or at the start of the window
                if (judgeNextFree[j].getTime() <= windowStart.getTime()) {
                    if (
                        soonestJudgeFree === null ||
                        judgeNextFree[j].getTime() < soonestJudgeFree.getTime()
                    ) {
                        soonestJudgeIdx = j;
                        soonestJudgeFree = judgeNextFree[j];
                    }
                }
            }

            // If no judge is free at the start, find the soonest judge who will be free inside the window
            if (soonestJudgeIdx === -1) {
                for (let j = 0; j < judgeCount; j++) {
                    if (
                        judgeNextFree[j].getTime() < windowEnd.getTime() // judge will be free *before* the window ends
                        && (
                            soonestJudgeFree === null ||
                            judgeNextFree[j].getTime() < soonestJudgeFree.getTime()
                        )
                    ) {
                        soonestJudgeIdx = j;
                        soonestJudgeFree = judgeNextFree[j];
                    }
                }
            }

            // If we found a possible judge/time:
            if (soonestJudgeIdx !== -1 && soonestJudgeFree) {
                // Team can start at the max of windowStart and judge's availability
                const start = new Date(Math.max(windowStart.getTime(), soonestJudgeFree.getTime()));
                const finish = new Date(start.getTime() + duration * 60000);
                if (finish > windowEnd) continue; // Not enough room in this window

                // Prepare the new event
                const evento: Evento = {
                    nombre: "Escrutinio",
                    tipo: "Concurrent Activity",
                    start,
                    end: finish,
                    duracion: duration
                };

                // Check for collision (paranoid, but just in case)
                if (hasCollision(horarioActual, evento, 1)) continue;

                // Assign horario
                (team as any).horario = horarioActual.concat(evento);

                // Update judge's next free
                judgeNextFree[soonestJudgeIdx] = finish;

                escrutinioEndTimes[teamIdx] = finish;
                assigned = true;
                break;
            }
        }

        if (!assigned) {
            throw new Error(
                `No hay tiempo suficiente para el escrutinio de ${team.nombre} antes del deadline`
            );
        }
    }
    return escrutinioEndTimes;
}
