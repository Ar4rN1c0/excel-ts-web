import { hasCollision } from "../math/check";
import { getAvailableWindows } from "../math/windows";
import { Equipo, Evento, Categoria, DurationsByCategory } from "../../types/types";

function getDurationsForCategory(
    cat: Categoria,
    durationsByCategory: DurationsByCategory
): number[] {
    const proper = cat as keyof DurationsByCategory;
    const lower = cat.toLowerCase() as keyof DurationsByCategory;
    const arr = durationsByCategory[proper] ?? durationsByCategory[lower];
    if (!arr || arr.length === 0) {
        throw new Error(`No durations configured for category "${cat}".`);
    }
    return arr;
}

/**
 * ESTRUCTURADO, pipelined con JUECES = FASES A LA VEZ (global lanes):
 * - Hay J "lanes" globales (J = nº de jueces). Lane i ≡ "Fase i+1 / Juez i+1".
 * - Cada categoría define cuántas fases recorre (nCat) y las duraciones por índice.
 * - Un equipo de categoría cat usa los lanes 0..nCat-1, en orden.
 * - Cada lane tiene concurrencia 1 GLOBAL (compartido entre categorías).
 */
export function assignEstructuradoPipelinedScrutiny(
    teams: Equipo[],
    startTimes: Date[],
    end: Date,
    durationsByCategory: DurationsByCategory,
    numJudges: number // = config["Nº de Jueces para el escrutinio"]
): Date[] {
    if (!Number.isFinite(numJudges) || numJudges <= 0) {
        throw new Error(`"Nº de Jueces para el escrutinio" debe ser > 0 (recibido ${numJudges}).`);
    }

    // Validación: ninguna categoría puede requerir más fases que jueces (lanes)
    for (const team of teams) {
        const cat = team.categoria;
        const nCat = getDurationsForCategory(cat, durationsByCategory).length;
        if (nCat > numJudges) {
            throw new Error(
                `La categoría ${cat} requiere ${nCat} fases, pero solo hay ${numJudges} jueces (fases a la vez).`
            );
        }
    }

    // Lanes globales por índice de fase (0..numJudges-1)
    const globalLaneSchedules: Evento[][] = Array.from({ length: numJudges }, () => []);

    const endTimes: Date[] = [];

    // Orden por hora de inicio
    const order = startTimes
        .map((d, i) => ({ idx: i, time: d }))
        .sort((a, b) => a.time.getTime() - b.time.getTime())
        .map(e => e.idx);

    for (const teamIdx of order) {
        const team = teams[teamIdx];
        const cat = team.categoria;
        const durations = getDurationsForCategory(cat, durationsByCategory);
        const nPhases = durations.length;

        let prevPhaseEnd = startTimes[teamIdx];
        (team as any).horario = (team as any).horario || [];
        const personalSchedule = (team as any).horario as Evento[];

        for (let phase = 0; phase < nPhases; phase++) {
            const duration = durations[phase];
            const laneSchedule = globalLaneSchedules[phase]; // << GLOBAL lane por índice de fase
            
            // 1) Huecos donde el equipo está libre (solo su horario personal)
            const teamWindows = getAvailableWindows(prevPhaseEnd, end, personalSchedule, duration);
            console.log(phase, team, cat, teamWindows, prevPhaseEnd, end)

            let assigned = false;

            // 2) Para cada hueco del equipo, comprobar colisión con el LANE global (concurrencia 1)
            for (const [windowStart, windowEnd] of teamWindows) {
                const candidateEvent: Evento = {
                    nombre: `Escrutinio ${cat} · Fase ${phase + 1}`,
                    tipo: "Concurrent Activity",
                    start: windowStart,
                    end: windowEnd,
                    duracion: duration
                };

                // Concurrencia = 1 en el lane de la fase (compartido entre categorías)
                if (!hasCollision(laneSchedule, candidateEvent, 1)) {
                    personalSchedule.push(candidateEvent);
                    laneSchedule.push(candidateEvent);
                    prevPhaseEnd = windowEnd;
                    assigned = true;
                    break;
                }
            }

            if (!assigned) {
                throw new Error(
                    `No hay ventana disponible para el equipo ${team.nombre} (cat ${cat}) en la fase ${phase + 1}`
                );
            }
        }

        endTimes[teamIdx] = prevPhaseEnd;
    }

    return endTimes;
}
