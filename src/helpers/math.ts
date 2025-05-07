import { Evento } from "../types/types";

export const mins = (n: number) => n * 60 * 1000
export function shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Verifica si al añadir un nuevo evento a un conjunto de eventos existentes
 * se respeta el máximo de concurrencia permitido.
 * 
 * @param eventos - Array de eventos ya existentes
 * @param nuevo - Evento que se quiere añadir
 * @param maxConcurrencia - Máximo número de eventos que pueden solaparse
 * @returns true si NO se rompe la concurrencia, false si se rompe
 */
export function checkConcurrency(
    eventos: Evento[],
    nuevo: Evento,
    maxConcurrencia: number
): boolean {
    const start = nuevo.start.getTime();
    const end = nuevo.end.getTime();

    let concurrencia = 0;

    for (const evento of eventos) {
        const evStart = evento.start.getTime();
        const evEnd = evento.end.getTime();

        // Si hay solapamiento estricto (incluso si un evento termina justo cuando otro empieza)
        if (evStart < end && evEnd > start) {
            concurrencia++;
            if (concurrencia >= maxConcurrencia) return false;
        }
    }

    return true;
}



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

  // Filtrar eventos que se solapan con el intervalo base
  const agenda = [...eventos]
    .filter(e => e.end > start && e.start < end)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const huecos: [Date, Date][] = [];

  // Determinar huecos disponibles entre eventos
  if (agenda.length === 0) {
    huecos.push([start, end]);
  } else {
    if (start < agenda[0].start) {
      huecos.push([start, agenda[0].start]);
    }

    for (let i = 0; i < agenda.length - 1; i++) {
      huecos.push([agenda[i].end, agenda[i + 1].start]);
    }

    if (agenda[agenda.length - 1].end < end) {
      huecos.push([agenda[agenda.length - 1].end, end]);
    }
  }

  // Dentro de cada hueco, deslizar en pasos de 1 minuto para encontrar ventanas válidas
  for (const [huecoInicio, huecoFin] of huecos) {
    const totalMins = (huecoFin.getTime() - huecoInicio.getTime()) / 60000;
    if (totalMins < duracion) continue;

    for (
      let inicio = new Date(huecoInicio);
      inicio.getTime() + mins(duracion) <= huecoFin.getTime();
      inicio = new Date(inicio.getTime() + mins(1))
    ) {
      const fin = new Date(inicio.getTime() + mins(duracion));
      ventanas.push([inicio, fin]);
    }
  }

  return ventanas;
};
