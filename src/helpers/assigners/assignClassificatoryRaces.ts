import { Categoria, Equipo, RaceConfig, Evento } from "../../types/types";
import { shuffleArray } from "../math";

interface UnsortedRace {
  team1: Equipo;
  team2: Equipo;
  earliestStart: Date;
}

export const assignClassificatoryRaces = (teams: Equipo[], raceConfig: RaceConfig): Evento[] => {
  const { heatsPerCategory } = raceConfig;
  const teamsByCategory: Record<Categoria, Equipo[]> = {
    Entry: [],
    Development: [],
    Professional: [],
  };

  // Categorize teams
  teams.forEach(team => teamsByCategory[team.categoria].push(team));

  const unsortedRaces: UnsortedRace[] = [];

  // Process each category
  (Object.keys(teamsByCategory) as Categoria[]).forEach(category => {
    const teamsInCategory = teamsByCategory[category];
    if (teamsInCategory.length === 0) return;

    const numHeats = heatsPerCategory[category].max;
    
    for (let heat = 0; heat < numHeats; heat++) {
      // Shuffle teams for each heat
      const shuffledTeams = [...teamsInCategory];
      shuffleArray(shuffledTeams);

      // Create pairs for this heat
      for (let i = 0; i < shuffledTeams.length; i += 2) {
        if (i + 1 >= shuffledTeams.length) break;
        
        const team1 = shuffledTeams[i];
        const team2 = shuffledTeams[i + 1];
        
        // Get escrutinio events
        const escrutinio1 = team1.horario.find(e => e.nombre === "Escrutinio");
        const escrutinio2 = team2.horario.find(e => e.nombre === "Escrutinio");
        
        if (escrutinio1 && escrutinio2) {
          // Determine earliest possible start time (latest escrutinio end)
          const startTime = new Date(Math.max(
            escrutinio1.end.getTime(),
            escrutinio2.end.getTime()
          ));

          unsortedRaces.push({
            team1,
            team2,
            earliestStart: startTime
          });
        }
      }
    }
  });

  // Sort races by their earliest possible start time
  unsortedRaces.sort((a, b) => a.earliestStart.getTime() - b.earliestStart.getTime());

  // Schedule races sequentially
  const allRaces: Evento[] = [];
  let lastRaceEnd: Date | null = null;
  let raceNumber = 1;

  unsortedRaces.forEach(race => {
    const start = lastRaceEnd
      ? new Date(Math.max(race.earliestStart.getTime(), lastRaceEnd.getTime()))
      : race.earliestStart;

    const end = new Date(start.getTime() + raceConfig.duration * 60000);
    
    const raceEvent: Evento = {
      tipo: "Race",
      start,
      end,
      duracion: raceConfig.duration,
      nombre: `Carrera Clasificatoria ${raceNumber} - ${race.team1.nombre} vs ${race.team2.nombre}`,
    };

    // Update both teams' schedules
    race.team1.horario.push(raceEvent);
    race.team2.horario.push(raceEvent);
    
    allRaces.push(raceEvent);
    lastRaceEnd = end;
    raceNumber++;
  });

  return allRaces;
};