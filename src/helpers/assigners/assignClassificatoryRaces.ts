import { Categoria, Equipo, RaceConfig, Evento } from "../../types/types";
import { hasCollision } from "../math/check";
import { generateUnsortedRacesByCategory } from "../generators/generateRaces";
import { findFirstSharedWindow, getAvailableWindows } from "../math/windows";

interface UnsortedRace {
  team1: Equipo;
  team2: Equipo;
  earliestStart: Date;
}

export const assignClassificatoryRaces = (
  teams: Equipo[],
  raceConfig: RaceConfig,
  start: Date,
  end: Date,
  maxRaces: number // new param!
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
  const unsortedRaces: (UnsortedRace & { categoria: Categoria })[] = [];
  for (const category of Object.keys(teamsByCategory) as Categoria[]) {
    const categoryTeams = teamsByCategory[category]!;
    if (categoryTeams.length === 0) continue;

    const maxHeats = heatsPerCategory[category].max;
    const races = generateUnsortedRacesByCategory(categoryTeams, maxHeats);

    // Annotate each race with its category
    for (const r of races) {
      unsortedRaces.push({ ...r, categoria: category });
    }
  }

  // Sort by earliest start time
  unsortedRaces.sort((a, b) => a.earliestStart.getTime() - b.earliestStart.getTime());

  const allRaces: Evento[] = [];
  let raceNumber = 1;

  // This will track the end times of currently ongoing races (max size: maxRaces)
  type RaceSlot = { end: Date }
  let raceSlots: RaceSlot[] = [];

  for (const { team1, team2, earliestStart, categoria } of unsortedRaces) {
    const raceDuration = duration[categoria];

    // Find the earliest time when a slot is available
    let slotAvailableFrom = start;
    if (raceSlots.length >= maxRaces) {
      // Find the slot that frees up the earliest
      raceSlots.sort((a, b) => a.end.getTime() - b.end.getTime());
      slotAvailableFrom = raceSlots[0].end;
      // Remove finished race(s)
      raceSlots = raceSlots.filter(slot => slot.end.getTime() > slotAvailableFrom.getTime());
    }

    // --- KEY FIX: Make sure we don't assign before both teams finish their own Escrutinio
    const earliestPossible = new Date(Math.max(
      slotAvailableFrom.getTime(),
      earliestStart.getTime()
    ));
    console.log(raceDuration)

    // Find windows for both teams from this earliestPossible time
    const windows1 = getAvailableWindows(earliestPossible, end, team1.horario, raceDuration);
    const windows2 = getAvailableWindows(earliestPossible, end, team2.horario, raceDuration);

    const sharedWindow = findFirstSharedWindow(windows1, windows2, raceDuration);

    if (!sharedWindow) {
      throw new Error(`No se pudo asignar carrera para ${team1.nombre} vs ${team2.nombre}`);
    }

    const [startTime, endTime] = sharedWindow;
    const newEvent: Evento = {
      tipo: "Race",
      start: startTime,
      end: endTime,
      duracion: raceDuration,
      nombre: `Carrera Clasificatoria ${raceNumber++} - ${team1.nombre} vs ${team2.nombre}`,
    };

    const collision1 = hasCollision(team1.horario, newEvent, 1);
    const collision2 = hasCollision(team2.horario, newEvent, 1);

    if (!collision1 && !collision2) {
      team1.horario.push(newEvent);
      team2.horario.push(newEvent);
      allRaces.push(newEvent);
      raceSlots.push({ end: newEvent.end });
      // (Don't advance a global lastAssigned; parallelism handled by slots)
    } else {
      throw new Error(`Colisión al asignar carrera entre ${team1.nombre} y ${team2.nombre}`);
    }
  }

  return allRaces;
};
