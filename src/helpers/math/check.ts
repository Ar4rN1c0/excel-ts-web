import { Evento } from "../../types/types";

/**
 * Verifica si al añadir un nuevo evento a un conjunto de eventos existentes
 * se respeta el máximo de concurrencia permitido para eventos con el mismo nombre.
 * 
 * @param eventos - Array de eventos ya existentes
 * @param nuevo - Evento que se quiere añadir
 * @param maxConcurrencia - Máximo número de eventos con el mismo nombre que pueden solaparse
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
    if (evento.nombre !== nuevo.nombre) continue;

    const evStart = evento.start.getTime();
    const evEnd = evento.end.getTime();

    // Si hay solapamiento estricto entre eventos con el mismo nombre
    if (evStart < end && evEnd > start) {
      concurrencia++;
      if (concurrencia >= maxConcurrencia) return false;
    }
  }

  return true;
}

/**
 * Verifica si un evento candidato colisiona con eventos existentes.
 * Si colisiona con un evento del mismo nombre, se verifica la concurrencia máxima.
 * 
 * @param eventos - Lista de eventos ya existentes
 * @param candidato - Evento que se quiere añadir
 * @param maxConcurrencia - Máximo de concurrencia permitido por nombre
 * @returns true si hay colisión, false si se puede añadir sin conflicto
 */
export function hasCollision(
  eventos: Evento[],
  candidato: Evento,
  maxConcurrencia: number
): boolean {
  const start = candidato.start.getTime();
  const end = candidato.end.getTime();

  for (const evento of eventos) {
    const evStart = evento.start.getTime();
    const evEnd = evento.end.getTime();

    const solapan = evStart < end && evEnd > start;

    if (!solapan) continue;

    // Si es el mismo nombre, verificamos la concurrencia
    if (evento.nombre === candidato.nombre) {
      if (!checkConcurrency(eventos, candidato, maxConcurrencia)) {
        return true; // colisión por concurrencia excedida
      }
      continue; // permite la colisión si no se excede la concurrencia
    }

    // Colisión con otro evento de distinto nombre
    return true;
  }

  // Ninguna colisión relevante
  return false;
}
