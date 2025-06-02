import { DurationMap, Equipo, Evento, Priorities } from "../../types/types";
import { hasCollision } from "../math/check";
import { mins } from "../math/math";
import { getAvailableWindows } from "../math/windows";

// Minimum buffer in milliseconds (5 minutes)
const MIN_BUFFER_MS = mins(5);

export const assingSmallDistributed = (
  teams: Equipo[],
  startDate: Date,
  endDate: Date,
  maxJudges: number,
  durationMap: DurationMap,
  eventName: string,
  priorities?: Priorities
): Date => {
  const globalEvents: Evento[] = [];

  // Only teams that require an event
  const filteredTeams = teams.filter(team => durationMap[team.categoria] > 0);
  const windowsCache = new Map<string, [Date, Date][]>();

  // Prepare sorting
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

  // Calculate how much buffer we can use
  const eventDurations = sortedTeams.map(team => durationMap[team.categoria]);
  const totalEventDuration = eventDurations.reduce((a, b) => a + b, 0);
  const availableTime = endDate.getTime() - startDate.getTime();
  const gaps = sortedTeams.length - 1;

  let bufferMs = gaps > 0 ? Math.floor((availableTime - totalEventDuration) / gaps) : 0;
  bufferMs = Math.max(Math.min(bufferMs, availableTime), MIN_BUFFER_MS);

  // Assign events spreading them as evenly as possible
  let currentTime = new Date(startDate);

  for (const [i, team] of sortedTeams.entries()) {
    const duration = durationMap[team.categoria];
    const posiblesVentanas = windowsCache.get(team.nombre)!;

    let assigned = false;

    // Try to find the earliest available window that starts after currentTime
    for (const [candidateStart, candidateEnd] of posiblesVentanas) {
      if (candidateStart.getTime() < currentTime.getTime()) continue;

      const event: Evento = {
        nombre: eventName,
        duracion: duration,
        start: candidateStart,
        end: candidateEnd,
        tipo: "Concurrent Activity"
      };

      // Consider the team's own schedule plus global events
      const personalSchedule = team.horario.filter(
        e => e.end > startDate && e.start < endDate
      );

      if (
        !hasCollision(personalSchedule.concat(globalEvents), event, maxJudges)
      ) {
        team.horario.push(event);
        globalEvents.push(event);
        assigned = true;

        // Move currentTime forward by event duration and the calculated buffer, except after last event
        if (i < sortedTeams.length - 1) {
          currentTime = new Date(candidateEnd.getTime() + bufferMs);
        }
        break;
      }
    }

    if (!assigned) {
      throw new Error(`No space for ${team.nombre} in ${eventName}`);
    }
  }

  // Return the latest end date among assigned events
  return new Date(Math.max(...globalEvents.map(e => e.end.getTime())));
};
