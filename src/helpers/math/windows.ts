import { Evento, GlobalConfig } from "../../types/types";
import { mins } from "./math";

/**
 * Encuentra todas las ventanas posibles dentro del intervalo dado
 * donde un evento de cierta duración puede ubicarse sin solaparse
 * con otros eventos.
 */
export const getAvailableWindows = (
  start: Date,
  end: Date,
  eventos: Evento[],
  duracion: number
): [Date, Date][] => {
  const ventanas: [Date, Date][] = [];

  const duracionMs = duracion * 60000;

  // Filtrar y ordenar eventos que se solapan con el intervalo
  const agenda = eventos
    .filter(e => e.end > start && e.start < end)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const huecos: [number, number][] = [];

  const startMs = start.getTime();
  const endMs = end.getTime();

  if (agenda.length === 0) {
    huecos.push([startMs, endMs]);
  } else {
    if (startMs < agenda[0].start.getTime()) {
      huecos.push([startMs, agenda[0].start.getTime()]);
    }

    for (let i = 0; i < agenda.length - 1; i++) {
      huecos.push([agenda[i].end.getTime(), agenda[i + 1].start.getTime()]);
    }

    const lastEnd = agenda[agenda.length - 1].end.getTime();
    if (lastEnd < endMs) {
      huecos.push([lastEnd, endMs]);
    }
  }

  // Generar ventanas válidas deslizándose 1 minuto
  for (const [inicioMs, finMs] of huecos) {
    const available = finMs - inicioMs;
    if (available < duracionMs) continue;

    for (let currentStart = inicioMs; currentStart + duracionMs <= finMs; currentStart += 60000) {
      ventanas.push([
        new Date(currentStart),
        new Date(currentStart + duracionMs)
      ]);
    }
  }

  return ventanas;
};

export function getGlobalWindows(config: GlobalConfig) {
  const windows: [Date, Date][] = [];

  for (let i = 1; i <= config.NumberOfDays; i++) {
    const startKey = `Dia ${i} Start`;
    const endKey = `Dia ${i} End`;

    const start = config[startKey as keyof GlobalConfig];
    const end = config[endKey as keyof GlobalConfig];

    if (typeof start === "string" && typeof end === "string") {
      windows.push([new Date(start), new Date(end)]);
    } else {
      console.warn(`Skipping day ${i} due to invalid date values.`);
    }
  }


  return windows
}

// Función auxiliar para encontrar la primera ventana compartida
export const findFirstSharedWindow = (
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
