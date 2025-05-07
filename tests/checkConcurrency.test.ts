import { checkConcurrency } from "../src/helpers/math";
import { Evento } from "../src/types/types";

describe("checkConcurrency", () => {
    const baseEvento = (start: string, end: string): Evento => ({
      nombre: "Test",
      duracion: 0,
      tipo: "Concurrent Activity",
      start: new Date(start),
      end: new Date(end),
    });
  
    it("permite añadir evento cuando no hay solapamientos", () => {
      const eventos: Evento[] = [
        baseEvento("2025-06-17T09:00:00", "2025-06-17T09:10:00"),
        baseEvento("2025-06-17T09:20:00", "2025-06-17T09:30:00"),
      ];
      const nuevo = baseEvento("2025-06-17T09:10:00", "2025-06-17T09:20:00");
  
      expect(checkConcurrency(eventos, nuevo, 2)).toBe(true);
    });
  
    it("detecta solapamiento en el inicio", () => {
      const eventos: Evento[] = [
        baseEvento("2025-06-17T09:00:00", "2025-06-17T09:10:00"),
      ];
      const nuevo = baseEvento("2025-06-17T09:09:00", "2025-06-17T09:15:00");
  
      expect(checkConcurrency(eventos, nuevo, 1)).toBe(false);
    });
  
    it("detecta solapamiento en el final", () => {
      const eventos: Evento[] = [
        baseEvento("2025-06-17T09:10:00", "2025-06-17T09:20:00"),
      ];
      const nuevo = baseEvento("2025-06-17T09:05:00", "2025-06-17T09:11:00");
  
      expect(checkConcurrency(eventos, nuevo, 1)).toBe(false);
    });
  
    it("permite evento que empieza justo cuando otro termina", () => {
      const eventos: Evento[] = [
        baseEvento("2025-06-17T09:00:00", "2025-06-17T09:10:00"),
      ];
      const nuevo = baseEvento("2025-06-17T09:10:00", "2025-06-17T09:20:00");
  
      expect(checkConcurrency(eventos, nuevo, 1)).toBe(true);
    });
  
    it("bloquea cuando se supera el máximo de concurrencia", () => {
      const eventos: Evento[] = [
        baseEvento("2025-06-17T09:00:00", "2025-06-17T09:20:00"),
        baseEvento("2025-06-17T09:10:00", "2025-06-17T09:30:00"),
      ];
      const nuevo = baseEvento("2025-06-17T09:15:00", "2025-06-17T09:25:00");
  
      expect(checkConcurrency(eventos, nuevo, 2)).toBe(false);
    });
  
    it("permite cuando concurrencia máxima no se supera", () => {
      const eventos: Evento[] = [
        baseEvento("2025-06-17T09:00:00", "2025-06-17T09:20:00"),
        baseEvento("2025-06-17T09:30:00", "2025-06-17T09:40:00"),
      ];
      const nuevo = baseEvento("2025-06-17T09:10:00", "2025-06-17T09:15:00");
  
      expect(checkConcurrency(eventos, nuevo, 2)).toBe(true);
    });
  });
  