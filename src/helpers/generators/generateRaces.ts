import { Equipo } from "../../types/types";
import { shuffleArray } from "../math/math";

interface UnsortedRace {
  team1: Equipo;
  team2: Equipo;
  earliestStart: Date;
}

// Dummy team object
const DUMMY_TEAM: Equipo = {
  nombre: "__BYE__",
  horario: [],
  categoria: "Entry",
  id: NaN
};

export function generateUnsortedRacesByCategory(
  teamsInCategory: Equipo[],
  numHeats: number
): UnsortedRace[] {
  const unsortedRaces: UnsortedRace[] = [];
  function getFullEscrutinioEnd(team: Equipo): Date | undefined {
    const escrutinioEvents = team.horario.filter(e => e.nombre.startsWith("Escrutinio"));
    if (escrutinioEvents.length === 0) return undefined;
    const latestDateEscrutinio = escrutinioEvents.reduce((latest, curr) =>
      curr.end > latest.end ? curr : latest
    ).end;
    return latestDateEscrutinio;
  }

  const teamCount = teamsInCategory.length;
  const totalSlotsNeeded = teamCount * numHeats;
  const totalRacesNeeded = Math.floor(totalSlotsNeeded / 2);

  // Track how many races each team has
  const raceCounts = new Map<string, number>();
  teamsInCategory.forEach(t => raceCounts.set(t.nombre, 0));

  // Generate all possible unique pairs
  let allPairs: [Equipo, Equipo][] = [];
  for (let i = 0; i < teamCount; i++) {
    for (let j = i + 1; j < teamCount; j++) {
      allPairs.push([teamsInCategory[i], teamsInCategory[j]]);
    }
  }
  shuffleArray(allPairs);

  // Used pairs to prevent immediate repeats
  const usedPairs = new Set<string>();

  // Assign races
  while (unsortedRaces.length < totalRacesNeeded) {
    // Sort teams by least races
    const teamsByRaces = [...teamsInCategory].sort((a, b) =>
      (raceCounts.get(a.nombre) ?? 0) - (raceCounts.get(b.nombre) ?? 0)
    );

    let assigned = false;
    // Try to pair lowest-race teams together
    for (let i = 0; i < teamsByRaces.length; i++) {
      if ((raceCounts.get(teamsByRaces[i].nombre) ?? 0) >= numHeats) continue;
      for (let j = i + 1; j < teamsByRaces.length; j++) {
        if ((raceCounts.get(teamsByRaces[j].nombre) ?? 0) >= numHeats) continue;
        const team1 = teamsByRaces[i];
        const team2 = teamsByRaces[j];
        const key = [team1.nombre, team2.nombre].sort().join('-');
        if (!usedPairs.has(key)) {
          const end1 = getFullEscrutinioEnd(team1);
          const end2 = getFullEscrutinioEnd(team2);
          if (end1 && end2) {
            const startTime = new Date(Math.max(end1.getTime(), end2.getTime()));
            unsortedRaces.push({ team1, team2, earliestStart: startTime });
            raceCounts.set(team1.nombre, (raceCounts.get(team1.nombre) ?? 0) + 1);
            raceCounts.set(team2.nombre, (raceCounts.get(team2.nombre) ?? 0) + 1);
            usedPairs.add(key);
            assigned = true;
            break;
          }
        }
      }
      if (assigned) break;
    }

    // If couldn't find any fresh pair, pair any team that still needs more races (even if repeat)
    if (!assigned) {
      const needMore = teamsInCategory.filter(t => (raceCounts.get(t.nombre) ?? 0) < numHeats);
      if (needMore.length < 2) {
        // Only one team left: assign it a bye against dummy
        const team1 = needMore[0] ?? teamsInCategory[0];
        const end1 = getFullEscrutinioEnd(team1);
        if (end1) {
          unsortedRaces.push({
            team1,
            team2: DUMMY_TEAM,
            earliestStart: end1
          });
          raceCounts.set(team1.nombre, (raceCounts.get(team1.nombre) ?? 0) + 1);
          // dummy team does NOT get race count
        }
      } else {
        // Arbitrarily pick the first two that still need races
        const team1 = needMore[0];
        const team2 = needMore[1];
        const end1 = getFullEscrutinioEnd(team1);
        const end2 = getFullEscrutinioEnd(team2);
        if (end1 && end2) {
          const startTime = new Date(Math.max(end1.getTime(), end2.getTime()));
          unsortedRaces.push({ team1, team2, earliestStart: startTime });
          raceCounts.set(team1.nombre, (raceCounts.get(team1.nombre) ?? 0) + 1);
          raceCounts.set(team2.nombre, (raceCounts.get(team2.nombre) ?? 0) + 1);
        }
      }
    }
  }

  // If odd, ensure that all teams have numHeats races by assigning byes
  let teamNeedsMore = teamsInCategory.find(t => (raceCounts.get(t.nombre) ?? 0) < numHeats);
  while (teamNeedsMore) {
    const end1 = getFullEscrutinioEnd(teamNeedsMore);
    if (end1) {
      unsortedRaces.push({
        team1: teamNeedsMore,
        team2: DUMMY_TEAM,
        earliestStart: end1,
      });
      raceCounts.set(teamNeedsMore.nombre, (raceCounts.get(teamNeedsMore.nombre) ?? 0) + 1);
    }
    teamNeedsMore = teamsInCategory.find(t => (raceCounts.get(t.nombre) ?? 0) < numHeats);
  }

  return unsortedRaces;
}
