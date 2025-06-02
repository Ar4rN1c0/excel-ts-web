import { Equipo, Evento } from "../../types/types";
import { hasCollision } from "../math/check";

/**
 * Assigns escrutinio to teams as soon as they finish register and a judge is free.
 * @param teams 
 * @param startTimes Array of each team's registration end time
 * @param end Deadline for finishing
 * @param judgeCount Number of simultaneous escrutinio possible
 * @param durationsByCategory Duration per category
 * @returns Array of escrutinio end times per team
 */
export function assignDesestructuradoPipelinedScrutiny(
    teams: Equipo[],
    startTimes: Date[],
    end: Date,
    judgeCount: number,
    durationsByCategory: { [key: string]: number }
): Date[] {
    const judgeNextFree: Date[] = new Array(judgeCount).fill(new Date(Math.min(...startTimes.map(d => d.getTime()))));
    const order = startTimes
        .map((d, i) => ({ idx: i, time: d }))
        .sort((a, b) => a.time.getTime() - b.time.getTime())
        .map(e => e.idx);

    const escrutinioEndTimes: Date[] = [];
    for (const teamIdx of order) {
        const team = teams[teamIdx];
        const readyAt = startTimes[teamIdx];
        const duration = durationsByCategory[team.categoria];

        // Find the judge that will be free the earliest
        let soonestJudgeIdx = 0;
        let soonestJudgeFree = judgeNextFree[0];
        for (let j = 1; j < judgeCount; j++) {
            if (judgeNextFree[j].getTime() < soonestJudgeFree.getTime()) {
                soonestJudgeIdx = j;
                soonestJudgeFree = judgeNextFree[j];
            }
        }
        // Team can start when both it's ready and a judge is free
        const start = new Date(Math.max(readyAt.getTime(), soonestJudgeFree.getTime()));
        const finish = new Date(start.getTime() + duration * 60000);

        if (finish > end) {
            throw new Error("No hay tiempo suficiente para todos los escrutinios");
        }

        // --- COLLISION CHECK ---
        // Create the "Evento" object to check
        const evento: Evento = {
            nombre: "Escrutinio",
            tipo: "Concurrent Activity",
            start,
            end: finish,
            duracion: duration
        };

        // Check against team.horario
        const horarioActual: Evento[] = (team as any).horario || [];
        if (hasCollision(horarioActual, evento, 1)) {
            throw new Error(`El equipo ${team.nombre} tiene un conflicto de horario con el escrutinio`);
        }

        // Assign horario
        (team as any).horario = horarioActual.concat(evento);

        // Update when this judge is next available
        judgeNextFree[soonestJudgeIdx] = finish;
        escrutinioEndTimes[teamIdx] = finish;
    }
    return escrutinioEndTimes;
}
