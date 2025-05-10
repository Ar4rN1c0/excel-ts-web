import { Categoria, Equipo, Evento, RaceConfig } from "../../../types/types";
import { generateUnsortedRacesByCategory } from "../../generators/generateRaces";
import { hasCollision } from "../../math/check";
import { getAvailableWindows } from "../../math/windows";

interface UnsortedRace {
  team1: Equipo;
  team2: Equipo;
  earliestStart: Date; // Will be recalculated based on escrutinio
}

export const assignDistributedRaces = (
  teams: Equipo[],
  raceConfig: RaceConfig,
  overallEnd: Date
): Evento[] => {
  const { heatsPerCategory, duration } = raceConfig;

  const teamsByCategory: Partial<Record<Categoria, Equipo[]>> = {};
  for (const team of teams) {
    if (!teamsByCategory[team.categoria]) {
      teamsByCategory[team.categoria] = [];
    }
    teamsByCategory[team.categoria]!.push(team);
  }

  // Generate unsorted races
  const unsortedRaces: UnsortedRace[] = [];
  for (const category of Object.keys(teamsByCategory) as Categoria[]) {
    const categoryTeams = teamsByCategory[category]!;
    if (categoryTeams.length === 0) continue;
    const maxHeats = heatsPerCategory[category].max;
    const races = generateUnsortedRacesByCategory(categoryTeams, maxHeats);
    unsortedRaces.push(...races);
  }

  // Find earliest global start and escrutinio end times for each team
  const escrutinioEnds = new Map<string, Date>();
  for (const team of teams) {
    const escrutinioEnd = team.horario
      .filter(e => e.nombre === "Escrutinio")
      .reduce((latest, e) => e.end > latest ? e.end : latest, new Date(0));
    escrutinioEnds.set(team.nombre, escrutinioEnd);
  }

  const globalStart = new Date(Math.min(...teams.flatMap(t =>
    t.horario.map(e => e.start.getTime())
  )));

  const allRaces: Evento[] = [];
  const totalRaces = unsortedRaces.length;
  let raceNumber = 1;

  unsortedRaces.forEach((race, index) => {
    const { team1, team2 } = race;

    // Ensure both teams completed escrutinio
    const escru1End = escrutinioEnds.get(team1.nombre) ?? globalStart;
    const escru2End = escrutinioEnds.get(team2.nombre) ?? globalStart;

    const earliestValidStart = new Date(
      Math.max(globalStart.getTime(), escru1End.getTime(), escru2End.getTime())
    );

    // Target time for even distribution
    const totalDuration = overallEnd.getTime() - earliestValidStart.getTime();
    const targetTime = new Date(earliestValidStart.getTime() + ((index + 0.5) / totalRaces) * totalDuration);

    const windows1 = getAvailableWindows(earliestValidStart, overallEnd, team1.horario, duration);
    const windows2 = getAvailableWindows(earliestValidStart, overallEnd, team2.horario, duration);

    const sharedWindows: [Date, Date][] = [];

    for (const [w1Start, w1End] of windows1) {
      for (const [w2Start, w2End] of windows2) {
        const start = new Date(Math.max(w1Start.getTime(), w2Start.getTime()));
        const end = new Date(start.getTime() + duration);
        if (end <= w1End && end <= w2End) {
          sharedWindows.push([start, end]);
        }
      }
    }

    if (sharedWindows.length === 0) {
      throw new Error(`No shared window for ${team1.nombre} vs ${team2.nombre}`);
    }

    sharedWindows.sort(([startA], [startB]) =>
      Math.abs(startA.getTime() - targetTime.getTime()) -
      Math.abs(startB.getTime() - targetTime.getTime())
    );

    let assigned = false;

    for (const [start, end] of sharedWindows) {
      const newEvent: Evento = {
        tipo: "Race",
        start,
        end,
        duracion: duration,
        nombre: `Carrera Clasificatoria ${raceNumber++} - ${team1.nombre} vs ${team2.nombre}`,
      };

      if (
        !hasCollision(team1.horario, newEvent, 1) &&
        !hasCollision(team2.horario, newEvent, 1)
      ) {
        team1.horario.push(newEvent);
        team2.horario.push(newEvent);
        allRaces.push(newEvent);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      throw new Error(`Collision assigning race between ${team1.nombre} and ${team2.nombre}`);
    }
  });

  return allRaces;
};
