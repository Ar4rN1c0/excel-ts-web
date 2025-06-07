import { DurationMap, Equipo, Evento, Priorities } from "../../types/types";
import { hasCollision } from "../math/check";
import { getAvailableWindows } from "../math/windows";

export const assignSmallEvent = (
  teams: Equipo[],
  startDate: Date,
  endDate: Date,
  maxJudges: number,
  durationMap: DurationMap,
  eventName: string,
  priorities?: Priorities,
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

    let assigned = false;

    for (const [candidateStart, candidateEnd] of posiblesVentanas) {
      const event: Evento = {
        nombre: eventName,
        duracion: duration,
        start: candidateStart,
        end: candidateEnd,
        tipo: "Concurrent Activity"
      };

      const personalSchedule = team.horario.filter(
        e => e.end > startDate && e.start < endDate
      );

      if (
        !hasCollision(personalSchedule.concat(globalEvents), event, maxJudges)
      ) {
        team.horario.push(event);
        globalEvents.push(event);
        assignedEvents.push(event);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      throw new Error(`No space for ${team.nombre} in ${eventName}`);
    }
  }

  return new Date(Math.max(...assignedEvents.map(e => e.end.getTime())));
};
