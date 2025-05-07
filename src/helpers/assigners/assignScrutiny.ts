import { Equipo, Evento, DurationMap } from "../../types/types";
import { mins } from "../math";

export const assignScrutiny = (
  teams: Equipo[],
  startDate: Date,
  endDate: Date,
  maxJudges: number,
  durationMap: DurationMap
) => {
  let currentStart = startDate;
  let iterator = 0;
  let maxDuration = 0;

  for (let team of teams) {
    if (iterator >= maxJudges) {
      currentStart = new Date(currentStart.getTime() + mins(maxDuration));
      iterator = 0;
      maxDuration = 0;
    }

    const scrutinyDuration = durationMap[team.categoria];

    const scrutiny: Evento = {
      nombre: "Escrutinio",
      duracion: scrutinyDuration,
      start: currentStart,
      end: new Date(currentStart.getTime() + mins(scrutinyDuration)),
      tipo: "Concurrent Activity"
    };

    if (scrutiny.end > endDate) {
      throw new Error(
        `No hay suficiente tiempo para completar el escrutinio de ${team.nombre} antes de ${endDate.toLocaleString()}`
      );
    }

    team.horario.push(scrutiny);
    iterator++;
    if (scrutinyDuration > maxDuration) {
      maxDuration = scrutinyDuration;
    }
  }

  return new Date(currentStart.getTime() + mins(maxDuration));
};
