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

  // Track how many times each team has raced (optional, for fairness)
  const raceCounts = new Map<string, number>();
  teamsInCategory.forEach(t => raceCounts.set(t.nombre, 0));

  for (let heat = 0; heat < numHeats; heat++) {
    const shuffledTeams = [...teamsInCategory];
    shuffleArray(shuffledTeams);

    for (let i = 0; i < shuffledTeams.length; i += 2) {
      // If at the end and odd, pair last with random other
      if (i + 1 >= shuffledTeams.length) {
        const lastTeam = shuffledTeams[i];

        // Randomly select another team to pair with, excluding itself
        let otherIdx: number;
        do {
          otherIdx = randomInt(0, shuffledTeams.length - 1);
        } while (otherIdx === i);

        const otherTeam = shuffledTeams[otherIdx];

        const escrutinio1 = lastTeam.horario.find(e => e.nombre === "Escrutinio");
        const escrutinio2 = otherTeam.horario.find(e => e.nombre === "Escrutinio");

        if (escrutinio1 && escrutinio2) {
          const startTime = new Date(Math.max(
            new Date(escrutinio1.end).getTime(),
            new Date(escrutinio2.end).getTime()
          ));

          unsortedRaces.push({
            team1: lastTeam,
            team2: otherTeam,
            earliestStart: startTime
          });
          raceCounts.set(lastTeam.nombre, (raceCounts.get(lastTeam.nombre) || 0) + 1);
          raceCounts.set(otherTeam.nombre, (raceCounts.get(otherTeam.nombre) || 0) + 1);
        }
        break; 
      }

      const team1 = shuffledTeams[i];
      const team2 = shuffledTeams[i + 1];

      const escrutinio1 = team1.horario.find(e => e.nombre === "Escrutinio");
      const escrutinio2 = team2.horario.find(e => e.nombre === "Escrutinio");

      if (escrutinio1 && escrutinio2) {
        const startTime = new Date(Math.max(
          new Date(escrutinio1.end).getTime(),
          new Date(escrutinio2.end).getTime()
        ));

        unsortedRaces.push({
          team1,
          team2,
          earliestStart: startTime
        });
        raceCounts.set(team1.nombre, (raceCounts.get(team1.nombre) || 0) + 1);
        raceCounts.set(team2.nombre, (raceCounts.get(team2.nombre) || 0) + 1);
      }
    }
  }

  // Optional: Log how many times each team is paired, for fairness/statistics
  // console.log("Race counts:", raceCounts);

  return unsortedRaces;
}
