import { Categoria, Equipo, RaceConfig, Evento } from "../../types/types";
import { hasCollision } from "../math/check";
import { generateUnsortedRacesByCategory } from "../generators/generateRaces";
import { findFirstSharedWindow, getAvailableWindows } from "../math/windows";

interface UnsortedRace {
  team1: Equipo;
  team2: Equipo;
  earliestStart: Date;
  categoria: Categoria;
}

// DUMMY_TEAM must match the one in the generator
const DUMMY_TEAM_NAME = "__BYE__";

function countOverlaps(start: Date, end: Date, scheduled: Evento[]): number {
  let count = 0;
  for (const ev of scheduled) {
    if (!(end <= ev.start || start >= ev.end)) {
      count++;
    }
  }
  return count;
}

export const assignClassificatoryRaces = (
  teams: Equipo[],
  raceConfig: RaceConfig,
  start: Date,
  end: Date,
  maxRaces: number
): Evento[] => {
  const { heatsPerCategory, duration } = raceConfig;

  // Group teams by category
  const teamsByCategory: Partial<Record<Categoria, Equipo[]>> = {};
  for (const team of teams) {
    if (!teamsByCategory[team.categoria]) {
      teamsByCategory[team.categoria] = [];
    }
    teamsByCategory[team.categoria]!.push(team);
  }

  // Generate all races (unsorted)
  const unsortedRaces: UnsortedRace[] = [];
  for (const category of Object.keys(teamsByCategory) as Categoria[]) {
    const categoryTeams = teamsByCategory[category]!;
    if (!categoryTeams || categoryTeams.length === 0) continue;

    const maxHeats = heatsPerCategory[category].max;
    const races = generateUnsortedRacesByCategory(categoryTeams, maxHeats);

    for (const r of races) {
      unsortedRaces.push({ ...r, categoria: category });
    }
  }

  // Sort by earliest start time
  unsortedRaces.sort((a, b) => a.earliestStart.getTime() - b.earliestStart.getTime());

  const allRaces: Evento[] = [];
  let raceNumber = 1;

  for (const { team1, team2, earliestStart, categoria } of unsortedRaces) {
    if (team1.nombre === DUMMY_TEAM_NAME && team2.nombre === DUMMY_TEAM_NAME) continue;

    const raceDuration = duration[categoria];
    let scheduled = false;
    let currentEarliest = Math.max(start.getTime(), earliestStart.getTime());

    while (!scheduled && currentEarliest + raceDuration * 60000 <= end.getTime()) {
      let windows1, windows2;
      if (team1.nombre === DUMMY_TEAM_NAME) {
        windows1 = getAvailableWindows(new Date(currentEarliest), end, team2.horario, raceDuration);
        windows2 = windows1;
      } else if (team2.nombre === DUMMY_TEAM_NAME) {
        windows1 = getAvailableWindows(new Date(currentEarliest), end, team1.horario, raceDuration);
        windows2 = windows1;
      } else {
        windows1 = getAvailableWindows(new Date(currentEarliest), end, team1.horario, raceDuration);
        windows2 = getAvailableWindows(new Date(currentEarliest), end, team2.horario, raceDuration);
      }
      const sharedWindow = findFirstSharedWindow(windows1, windows2, raceDuration);

      if (!sharedWindow) {
        throw new Error(
          `No se pudo asignar carrera para ${team1.nombre} vs ${team2.nombre}`
        );
      }

      const [startTime, endTime] = sharedWindow;

      // **Check overlaps**
      const overlapCount = countOverlaps(startTime, endTime, allRaces);

      if (overlapCount < maxRaces) {
        let nombreCarrera;
        if (team1.nombre === DUMMY_TEAM_NAME) {
          nombreCarrera = `Carrera Clasificatoria ${raceNumber++} - [Solo] ${team2.nombre}`;
        } else if (team2.nombre === DUMMY_TEAM_NAME) {
          nombreCarrera = `Carrera Clasificatoria ${raceNumber++} - [Solo] ${team1.nombre}`;
        } else {
          nombreCarrera = `Carrera Clasificatoria ${raceNumber++} - ${team1.nombre} vs ${team2.nombre}`;
        }

        const newEvent: Evento = {
          tipo: "Race",
          start: startTime,
          end: endTime,
          duracion: raceDuration,
          nombre: nombreCarrera,
        };

        // **Collision checks remain exactly as before**
        const collision1 = team1.nombre !== DUMMY_TEAM_NAME && hasCollision(team1.horario, newEvent, 1);
        const collision2 = team2.nombre !== DUMMY_TEAM_NAME && hasCollision(team2.horario, newEvent, 1);

        if (!collision1 && !collision2) {
          // Only assign to real teams
          if (team1.nombre !== DUMMY_TEAM_NAME) team1.horario.push(newEvent);
          if (team2.nombre !== DUMMY_TEAM_NAME) team2.horario.push(newEvent);
          allRaces.push(newEvent);
          scheduled = true;
        } else {
          throw new Error(
            `Colisión al asignar carrera entre ${team1.nombre} y ${team2.nombre}`
          );
        }
      } else {
        // Move currentEarliest to the next minute after the soonest conflicting race ends
        let nextAvailable = end.getTime();
        for (const ev of allRaces) {
          if (!(endTime <= ev.start || startTime >= ev.end)) {
            if (ev.end.getTime() > currentEarliest && ev.end.getTime() < nextAvailable) {
              nextAvailable = ev.end.getTime();
            }
          }
        }
        // Avoid infinite loop: if nextAvailable doesn't advance, increment by 1 minute
        if (nextAvailable <= currentEarliest) {
          currentEarliest += 60000; // add 1 minute
        } else {
          currentEarliest = nextAvailable;
        }
      }
    }

    if (!scheduled) {
      throw new Error(
        `No se pudo asignar carrera para ${team1.nombre} vs ${team2.nombre} (sin espacio en maxRaces)`
      );
    }
  }
  return allRaces;
};
