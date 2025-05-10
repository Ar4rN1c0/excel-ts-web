import { DurationMap, Equipo, Evento, Priorities } from "../../../types/types";
import { hasCollision } from "../../math/check";
import { getAvailableWindows } from "../../math/windows";


export const assignSmallDistributed = (
  teams: Equipo[],
  startDate: Date,
  endDate: Date,
  maxJudges: number,
  durationMap: DurationMap,
  eventName: string,
  priorities?: Priorities
): Date => {
  const globalEvents: Evento[] = [];
  const filteredTeams = teams.filter(team => durationMap[team.categoria] > 0);
  const windowsCache = new Map<string, [Date, Date][]>();

  const totalDuration = endDate.getTime() - startDate.getTime();
  const teamCount = filteredTeams.length;

  // Preprocess available windows for all teams
  for (const team of filteredTeams) {
    const windows = getAvailableWindows(
      startDate,
      endDate,
      team.horario,
      durationMap[team.categoria]
    );
    windowsCache.set(team.nombre, windows);
  }

  // Sort teams by priority
  const sortedTeams = [...filteredTeams].sort((a, b) => {
    const aPriority = priorities?.[a.categoria] ?? Infinity;
    const bPriority = priorities?.[b.categoria] ?? Infinity;
    return aPriority - bPriority;
  });

  sortedTeams.forEach((team, index) => {
    const duration = durationMap[team.categoria];
    const posiblesVentanas = windowsCache.get(team.nombre)!;

    // Calculate target time for this event (even distribution)
    const targetTime = new Date(startDate.getTime() + ((index + 0.5) / teamCount) * totalDuration);

    // Find the available window closest to the target time
    const sortedWindows = posiblesVentanas
      .filter(([s, e]) => (e.getTime() - s.getTime()) >= duration)
      .sort((a, b) => {
        const midA = a[0].getTime() + (a[1].getTime() - a[0].getTime()) / 2;
        const midB = b[0].getTime() + (b[1].getTime() - b[0].getTime()) / 2;
        return Math.abs(midA - targetTime.getTime()) - Math.abs(midB - targetTime.getTime());
      });

    let assigned = false;

    for (const [candidateStart, candidateEnd] of sortedWindows) {
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

      if (!hasCollision(personalSchedule.concat(globalEvents), event, maxJudges)) {
        team.horario.push(event);
        globalEvents.push(event);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      throw new Error(`No space for ${team.nombre} in ${eventName}`);
    }
  });

  return new Date(Math.max(...globalEvents.map(e => e.end.getTime())));
};
