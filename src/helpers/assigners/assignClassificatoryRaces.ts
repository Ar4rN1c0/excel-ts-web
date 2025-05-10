import { Categoria, Equipo, RaceConfig, Evento } from "../../types/types";
import { hasCollision } from "../math/check";
import { generateUnsortedRacesByCategory } from "../generators/generateRaces";
import { getAvailableWindows } from "../math/windows";
import { mins } from "../math/math";

interface UnsortedRace {
  team1: Equipo;
  team2: Equipo;
  earliestStart: Date;
}


export const assignClassificatoryRaces = (
  teams: Equipo[],
  raceConfig: RaceConfig,
  end: Date
): Evento[] => {
  const { heatsPerCategory, duration } = raceConfig;

  // Agrupar equipos por categoría
  const teamsByCategory: Partial<Record<Categoria, Equipo[]>> = {};
  for (const team of teams) {
    if (!teamsByCategory[team.categoria]) {
      teamsByCategory[team.categoria] = [];
    }
    teamsByCategory[team.categoria]!.push(team);
  }

  // Generar todas las carreras sin ordenar
  const unsortedRaces: UnsortedRace[] = [];
  for (const category of Object.keys(teamsByCategory) as Categoria[]) {
    const categoryTeams = teamsByCategory[category]!;
    if (categoryTeams.length === 0) continue;
    const maxHeats = heatsPerCategory[category].max;
    const races = generateUnsortedRacesByCategory(categoryTeams, maxHeats);
    unsortedRaces.push(...races);
  }

  // Ordenar por la hora más temprana posible
  unsortedRaces.sort((a, b) => a.earliestStart.getTime() - b.earliestStart.getTime());

  const allRaces: Evento[] = [];
  let raceNumber = 1;

  for (const { team1, team2, earliestStart } of unsortedRaces) {
    const windows1 = getAvailableWindows(earliestStart, end, team1.horario, duration);
    const windows2 = getAvailableWindows(earliestStart, end, team2.horario, duration);

    // Buscar primer rango de tiempo compartido válido
    const sharedWindow = findFirstSharedWindow(windows1, windows2, duration);
    if (!sharedWindow) {
      throw new Error(`No se pudo asignar carrera para ${team1.nombre} vs ${team2.nombre}`);
    }

    const [start, endRace] = sharedWindow;
    const newEvent: Evento = {
      tipo: "Race",
      start,
      end: endRace,
      duracion: duration,
      nombre: `Carrera Clasificatoria ${raceNumber++} - ${team1.nombre} vs ${team2.nombre}`,
    };

    // Validar colisiones y asignar
    if (
      !hasCollision(team1.horario, newEvent, 1) &&
      !hasCollision(team2.horario, newEvent, 1)
    ) {
      team1.horario.push(newEvent);
      team2.horario.push(newEvent);
      allRaces.push(newEvent);
    } else {
      throw new Error(`Colisión al asignar carrera entre ${team1.nombre} y ${team2.nombre}`);
    }
  }

  return allRaces;
};

// Función auxiliar para encontrar la primera ventana compartida
const findFirstSharedWindow = (
  windows1: [Date, Date][],
  windows2: [Date, Date][],
  duration: number
): [Date, Date] | null => {
  for (const [start1, end1] of windows1) {
    for (const [start2, end2] of windows2) {
      const start = new Date(Math.max(start1.getTime(), start2.getTime()));
      const end = new Date(start.getTime() + mins(duration));
      if (end.getTime() <= Math.min(end1.getTime(), end2.getTime())) {
        return [start, end];
      }
    }
  }
  return null;
};
