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

// Simple min-heap for Dates (stores numbers for easy comparison)
class MinHeap {
  private data: number[] = [];
  size() { return this.data.length; }
  peek() { return this.data[0]; }
  push(val: number) {
    this.data.push(val);
    this.bubbleUp();
  }
  pop() {
    const min = this.data[0];
    const end = this.data.pop()!;
    if (this.data.length) {
      this.data[0] = end;
      this.bubbleDown();
    }
    return min;
  }
  private bubbleUp() {
    let i = this.data.length - 1;
    while (i > 0) {
      let parent = Math.floor((i - 1) / 2);
      if (this.data[i] >= this.data[parent]) break;
      [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
      i = parent;
    }
  }
  private bubbleDown() {
    let i = 0, len = this.data.length;
    while (true) {
      let left = 2 * i + 1, right = 2 * i + 2, smallest = i;
      if (left < len && this.data[left] < this.data[smallest]) smallest = left;
      if (right < len && this.data[right] < this.data[smallest]) smallest = right;
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
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
  const heap = new MinHeap();

  for (const { team1, team2, earliestStart, categoria } of unsortedRaces) {
    const raceDuration = duration[categoria];

    // The earliest this race can start
    let earliest = Math.max(start.getTime(), earliestStart.getTime());

    // Free up race slots that have finished by now
    while (heap.size() && heap.peek() <= earliest) {
      heap.pop();
    }

    // If all race slots are busy, advance to the soonest available slot
    if (heap.size() >= maxRaces) {
      earliest = heap.peek();
      // Remove all races ending at this time
      while (heap.size() && heap.peek() <= earliest) heap.pop();
    }

    // Find available windows for both teams
    const windows1 = getAvailableWindows(new Date(earliest), end, team1.horario, raceDuration);
    const windows2 = getAvailableWindows(new Date(earliest), end, team2.horario, raceDuration);
    const sharedWindow = findFirstSharedWindow(windows1, windows2, raceDuration);

    if (!sharedWindow) {
      throw new Error(
        `No se pudo asignar carrera para ${team1.nombre} vs ${team2.nombre}`
      );
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
      // Push new race's end time to the heap (as timestamp for efficiency)
      heap.push(endTime.getTime());
    } else {
      throw new Error(
        `Colisión al asignar carrera entre ${team1.nombre} y ${team2.nombre}`
      );
    }
  }

  return allRaces;
};
