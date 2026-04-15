import { hasCollision } from "../src/helpers/math/check";
import { Evento } from "../src/types/types";

// Utilidad para crear eventos fácilmente
const createEvent = (
  nombre: string,
  start: string,
  end: string
): Evento => ({
  nombre,
  start: new Date(start),
  end: new Date(end),
  duracion: (new Date(end).getTime() - new Date(start).getTime()) / 60000,
  tipo: "Concurrent Activity"
});

describe("hasCollision", () => {
  const maxConcurrencia = 10; // No importa aquí, no estamos probando concurrencia

  test("no colisión con eventos completamente separados", () => {
    const eventos = [
      createEvent("A", "2025-05-10T10:00:00", "2025-05-10T11:00:00")
    ];
    const candidato = createEvent("B", "2025-05-10T11:00:00", "2025-05-10T12:00:00");

    expect(hasCollision(eventos, candidato, maxConcurrencia)).toBe(false);
  });

  test("colisión por solapamiento parcial", () => {
    const eventos = [
      createEvent("A", "2025-05-10T10:00:00", "2025-05-10T11:30:00")
    ];
    const candidato = createEvent("B", "2025-05-10T11:00:00", "2025-05-10T12:00:00");

    expect(hasCollision(eventos, candidato, maxConcurrencia)).toBe(true);
  });

  test("colisión por solapamiento total (contenimiento)", () => {
    const eventos = [
      createEvent("A", "2025-05-10T10:00:00", "2025-05-10T13:00:00")
    ];
    const candidato = createEvent("B", "2025-05-10T11:00:00", "2025-05-10T12:00:00");

    expect(hasCollision(eventos, candidato, maxConcurrencia)).toBe(true);
  });

  test("colisión cuando candidato contiene completamente otro evento", () => {
    const eventos = [
      createEvent("A", "2025-05-10T11:00:00", "2025-05-10T12:00:00")
    ];
    const candidato = createEvent("B", "2025-05-10T10:00:00", "2025-05-10T13:00:00");

    expect(hasCollision(eventos, candidato, maxConcurrencia)).toBe(true);
  });

  test("evento que cruza medianoche no colisiona si no hay solapamiento", () => {
    const eventos = [
      createEvent("A", "2025-05-10T22:00:00", "2025-05-11T00:00:00")
    ];
    const candidato = createEvent("B", "2025-05-11T00:00:00", "2025-05-11T01:00:00");

    expect(hasCollision(eventos, candidato, maxConcurrencia)).toBe(false);
  });

  test("evento que cruza medianoche colisiona si se solapa", () => {
    const eventos = [
      createEvent("A", "2025-05-10T22:00:00", "2025-05-11T00:30:00")
    ];
    const candidato = createEvent("B", "2025-05-11T00:00:00", "2025-05-11T01:00:00");

    expect(hasCollision(eventos, candidato, maxConcurrencia)).toBe(true);
  });

  test("evento candidato empieza y termina en día diferente al evento existente sin solaparse", () => {
    const eventos = [
      createEvent("A", "2025-05-10T22:00:00", "2025-05-11T00:00:00")
    ];
    const candidato = createEvent("B", "2025-05-11T01:00:00", "2025-05-11T02:00:00");

    expect(hasCollision(eventos, candidato, maxConcurrencia)).toBe(false);
  });

  test("evento empieza justo cuando otro termina (sin solape)", () => {
    const eventos = [
      createEvent("A", "2025-05-10T10:00:00", "2025-05-10T11:00:00")
    ];
    const candidato = createEvent("B", "2025-05-10T11:00:00", "2025-05-10T12:00:00");

    expect(hasCollision(eventos, candidato, maxConcurrencia)).toBe(false);
  });

  test("evento termina justo cuando otro empieza (sin solape)", () => {
    const eventos = [
      createEvent("A", "2025-05-10T11:00:00", "2025-05-10T12:00:00")
    ];
    const candidato = createEvent("B", "2025-05-10T10:00:00", "2025-05-10T11:00:00");

    expect(hasCollision(eventos, candidato, maxConcurrencia)).toBe(false);
  });
});
