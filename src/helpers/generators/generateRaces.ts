import { Equipo } from "../../types/types";
import { shuffleArray } from "../math/math";

export function generateUnsortedRacesByCategory(teamsInCategory: Equipo[], numHeats: number) {
  const unsortedRaces = [];

  for (let heat = 0; heat < numHeats; heat++) {
    const shuffledTeams = [...teamsInCategory];
    shuffleArray(shuffledTeams);

    for (let i = 0; i < shuffledTeams.length; i += 2) {
      if (i + 1 >= shuffledTeams.length) break;

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
      }
    }
  }

  return unsortedRaces;
}
