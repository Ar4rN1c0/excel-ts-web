// File: src/assigners/assignSmallEvent.ts

import { DurationMap, Equipo, Evento, Priorities } from "../../types/types";
import { hasCollision } from "../math/check";
import { getAvailableWindows } from "../math/windows";

/**
 * Asigna un evento "pequeño" (portfolios, verbal, etc.) a todos los equipos.
 * - Respeta la concurrencia por nombre de evento mediante `hasCollision`.
 * - Ordena equipos por prioridad y por nº de ventanas disponibles (menos ventanas primero).
 * - En modo NO avaricioso (isGreedy = false), evita pegar eventos "justo después"
 *   del último evento del equipo y empuja hacia bloques amplios (p. ej. la mañana libre del último día).
 */
export const assignSmallEvent = (
  teams: Equipo[],
  startDate: Date,
  endDate: Date,
  maxJudges: number,
  durationMap: DurationMap,
  eventName: string,
  priorities?: Priorities,
  isGreedy: boolean = true
): Date => {
  const globalEvents: Evento[] = [];

  const filteredTeams = teams.filter(team => durationMap[team.categoria] > 0);
  const windowsCache = new Map<string, [Date, Date][]>();

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    const aPriority = priorities?.[a.categoria] ?? Infinity;
    const bPriority = priorities?.[b.categoria] ?? Infinity;

    if (!windowsCache.has(a.nombre)) {
      const windows = getAvailableWindows(
        startDate,
        endDate,
        a.horario,
        durationMap[a.categoria]
      );
      windowsCache.set(a.nombre, windows);
    }
    if (!windowsCache.has(b.nombre)) {
      const windows = getAvailableWindows(
        startDate,
        endDate,
        b.horario,
        durationMap[b.categoria]
      );
      windowsCache.set(b.nombre, windows);
    }

    return aPriority !== bPriority
      ? aPriority - bPriority
      : windowsCache.get(a.nombre)!.length - windowsCache.get(b.nombre)!.length;
  });

  const assignedEvents: Evento[] = [];

  for (const team of sortedTeams) {
    const duration = durationMap[team.categoria];
    const posiblesVentanas = windowsCache.get(team.nombre)!;

    // Solo la parte de agenda que cae dentro del intervalo global, para buscar vecinos
    const personalSchedule = team.horario
      .filter(e => e.end > startDate && e.start < endDate)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    let assigned = false;

    if (isGreedy) {
      // ---- Earliest-fit: igual que antes ----
      for (const [candidateStart, candidateEnd] of posiblesVentanas) {
        const event: Evento = {
          nombre: eventName,
          duracion: duration,
          start: candidateStart,
          end: candidateEnd,
          tipo: "Concurrent Activity"
        };
        if (!hasCollision(personalSchedule.concat(globalEvents), event, maxJudges)) {
          team.horario.push(event);
          globalEvents.push(event);
          assignedEvents.push(event);
          assigned = true;
          break;
        }
      }
    } else {
      // ==== NO avaricioso: evitar pegarse al último evento y preferir bloques amplios ====
      // En lugar de anclar a un único "lastEventEnd", calculamos los VECINOS reales
      // para CADA ventana candidata: el fin previo y el inicio siguiente en la agenda del equipo.

      // Parámetros de anti-adyacencia (ajústalos o hazlos configurables si quieres)
      const minGapAfterPrevMs = 60 * 60_000;  // 60 min: no poner "justo después" del anterior
      const minGapBeforeNextMs = 30 * 60_000; // 30 min: no rozar el siguiente

      // Helpers para encontrar el vecino previo/siguiente respecto a una hora dada
      const getPrevEndTime = (tStart: number): number => {
        let prev = startDate.getTime(); // si no hay previo, frontera = startDate
        for (const e of personalSchedule) {
          const eEnd = e.end.getTime();
          if (eEnd <= tStart && eEnd >= prev) prev = eEnd;
          if (e.start.getTime() > tStart) break; // por estar ordenado
        }
        return prev;
      };

      const getNextStartTime = (tEnd: number): number | undefined => {
        for (const e of personalSchedule) {
          const eStart = e.start.getTime();
          if (eStart >= tEnd) return eStart;
        }
        return undefined;
      };

      // Función de puntuación:
      // 1) Rechaza ventanas fuera de [startDate, endDate].
      // 2) Penaliza FUERTE si está demasiado cerca del previo o del siguiente.
      // 3) Maximiza el "espacio mínimo" a sus vecinos (min(bufferBefore, bufferAfter)).
      // 4) Desempata por "aire total" y, muy levemente, por empezar un poco más tarde,
      //    lo que evita compactar justo tras el previo cuando hay un bloque libre posterior (p. ej. mañana del día siguiente).
      const score = (s: Date, e: Date): number => {
        const tS = s.getTime();
        const tE = e.getTime();

        if (tS < startDate.getTime() || tE > endDate.getTime()) {
          return Number.NEGATIVE_INFINITY;
        }

        const prevEnd = getPrevEndTime(tS);
        const nextStart = getNextStartTime(tE);
        const boundaryAfter = nextStart ?? endDate.getTime();

        // No empezar antes que el previo (no debería ocurrir si ventanas vienen de gaps)
        if (tS < prevEnd) return Number.NEGATIVE_INFINITY;

        const bufferBefore = tS - prevEnd;
        const bufferAfter = boundaryAfter - tE;

        // Anti-adyacencia dura
        if (bufferBefore < minGapAfterPrevMs) return -1e15;
        if (bufferAfter < minGapBeforeNextMs) return -1e15;

        // Métrica principal: queremos la ventana con mayor "mínimo" margen a vecinos
        const minBuffer = Math.min(bufferBefore, bufferAfter);
        const totalAir = bufferBefore + bufferAfter;

        // Pequeño sesgo a empezar algo más tarde (evita "pegarse" al borde anterior dentro del margen)
        return minBuffer * 1e9 + totalAir * 1e3 + tS * 1e-3;
      };

      const ordered = [...posiblesVentanas]
        .filter(([s, e]) => s >= startDate && e <= endDate)
        .sort((a, b) => {
          const sa = score(a[0], a[1]);
          const sb = score(b[0], b[1]);
          return sb - sa;
        });

      for (const [candidateStart, candidateEnd] of ordered) {
        const event: Evento = {
          nombre: eventName,
          duracion: duration,
          start: candidateStart,
          end: candidateEnd,
          tipo: "Concurrent Activity"
        };

        if (!hasCollision(personalSchedule.concat(globalEvents), event, maxJudges)) {
          team.horario.push(event);
          globalEvents.push(event);
          assignedEvents.push(event);
          assigned = true;
          break;
        }
      }
    }

    if (!assigned) {
      throw new Error(`No space for ${team.nombre} in ${eventName}`);
    }
  }

  return new Date(Math.max(...assignedEvents.map(e => e.end.getTime())));
};
