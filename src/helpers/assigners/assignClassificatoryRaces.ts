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
  end: Date
): Evento[] => {
  const { heatsPerCategory, duration } = raceConfig;
  console.log(start, end, "----")

  console.debug("Inicializando asignación de carreras clasificatorias...");
  console.debug("Duración de cada carrera:", duration);

  // Agrupar equipos por categoría
  const teamsByCategory: Partial<Record<Categoria, Equipo[]>> = {};
  for (const team of teams) {
    if (!teamsByCategory[team.categoria]) {
      teamsByCategory[team.categoria] = [];
    }
    teamsByCategory[team.categoria]!.push(team);
  }

  console.debug("Equipos agrupados por categoría:", teamsByCategory);

  // Generar todas las carreras sin ordenar
  const unsortedRaces: UnsortedRace[] = [];
  for (const category of Object.keys(teamsByCategory) as Categoria[]) {
    const categoryTeams = teamsByCategory[category]!;
    if (categoryTeams.length === 0) continue;

    const maxHeats = heatsPerCategory[category].max;
    console.debug(`Generando carreras para la categoría ${category} con máximo de heats: ${maxHeats}`);

    const races = generateUnsortedRacesByCategory(categoryTeams, maxHeats);
    console.debug(`Se generaron ${races.length} carreras no ordenadas para la categoría ${category}`);

    unsortedRaces.push(...races);
  }

  // Ordenar por la hora más temprana posible
  unsortedRaces.sort((a, b) => a.earliestStart.getTime() - b.earliestStart.getTime());
  console.debug("Carreras ordenadas por hora de inicio más temprana");

  const allRaces: Evento[] = [];
  let raceNumber = 1;
  let lastAssigned = start;

  for (const { team1, team2 } of unsortedRaces) {
    console.debug(`Asignando carrera entre ${team1.nombre} y ${team2.nombre}`);

    const windows1 = getAvailableWindows(lastAssigned, end, team1.horario, duration);
    const windows2 = getAvailableWindows(lastAssigned, end, team2.horario, duration);

    console.debug(`${team1.nombre} ventanas disponibles:`, windows1);
    console.debug(`${team2.nombre} ventanas disponibles:`, windows2);

    const sharedWindow = findFirstSharedWindow(windows1, windows2, duration);

    if (!sharedWindow) {
      console.error(`No se encontró ventana compartida para ${team1.nombre} vs ${team2.nombre}`);
      throw new Error(`No se pudo asignar carrera para ${team1.nombre} vs ${team2.nombre}`);
    }

    const [startTime, endTime] = sharedWindow;
    const newEvent: Evento = {
      tipo: "Race",
      start: startTime,
      end: endTime,
      duracion: duration,
      nombre: `Carrera Clasificatoria ${raceNumber++} - ${team1.nombre} vs ${team2.nombre}`,
    };

    console.debug("Propuesta de evento:", newEvent);

    const collision1 = hasCollision(team1.horario, newEvent, 1);
    const collision2 = hasCollision(team2.horario, newEvent, 1);

    if (!collision1 && !collision2) {
      console.debug("Asignando evento sin colisiones.");
      team1.horario.push(newEvent);
      team2.horario.push(newEvent);
      allRaces.push(newEvent);
      lastAssigned = newEvent.end; // advance the global scheduler
    } else {
      console.error(
        `Colisión detectada al asignar carrera: ${team1.nombre} vs ${team2.nombre}.\n` +
        `Collisión equipo 1: ${collision1}, equipo 2: ${collision2}`
      );
      throw new Error(`Colisión al asignar carrera entre ${team1.nombre} y ${team2.nombre}`);
    }
  }

  console.log("Asignación completada. Total de carreras:", allRaces.length);
  return allRaces;
};
