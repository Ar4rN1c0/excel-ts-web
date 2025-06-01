import { Equipo } from "../../types/types";
import { shuffleArray, randomInt } from "../math/math";

interface UnsortedRace {
  team1: Equipo;
  team2: Equipo;
  earliestStart: Date;
}

export function generateUnsortedRacesByCategory(
  teamsInCategory: Equipo[],
  numHeats: number
): UnsortedRace[] {
  const unsortedRaces: UnsortedRace[] = [];

  const getFullEscrutinioEnd = (team: Equipo): Date | undefined => {
    const escrutinioEvents = team.horario.filter(e => e.nombre.startsWith("Escrutinio"));
    if (escrutinioEvents.length === 0) return undefined;
    const latestDateEscrutinio = escrutinioEvents.reduce((latest, curr) =>
      curr.end > latest.end ? curr : latest
    ).end;
    return latestDateEscrutinio
  };

  const raceCounts = new Map<string, number>();
  teamsInCategory.forEach(t => raceCounts.set(t.nombre, 0));

  for (let heat = 0; heat < numHeats; heat++) {
    const shuffledTeams = [...teamsInCategory];
    shuffleArray(shuffledTeams);

    for (let i = 0; i < shuffledTeams.length; i += 2) {
      const team1 = shuffledTeams[i];
      let team2: Equipo;

      if (i + 1 >= shuffledTeams.length) {
        // Odd number of teams — pair last with another random
        let j;
        do {
          j = randomInt(0, shuffledTeams.length - 1);
        } while (j === i);
        team2 = shuffledTeams[j];
      } else {
        team2 = shuffledTeams[i + 1];
      }

      const end1 = getFullEscrutinioEnd(team1);
      const end2 = getFullEscrutinioEnd(team2);

      if (end1 && end2) {
        const startTime = new Date(Math.max(end1.getTime(), end2.getTime()));

        unsortedRaces.push({
          team1,
          team2,
          earliestStart: startTime,
        });

        raceCounts.set(team1.nombre, (raceCounts.get(team1.nombre) || 0) + 1);
        raceCounts.set(team2.nombre, (raceCounts.get(team2.nombre) || 0) + 1);
      }
    }
  }

  return unsortedRaces;
}
