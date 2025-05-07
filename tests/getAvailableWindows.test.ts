import { getAvailableWindows } from "../src/helpers/math";
import { Evento } from "../src/types/types";

const evento = (start: string, end: string): Evento => ({
    nombre: "Test",
    duracion: 0,
    tipo: "Concurrent Activity",
    start: new Date(start),
    end: new Date(end),
});

describe("getAvailableWindows", () => {
    const intervaloInicio = new Date("2025-06-17T09:00:00");
    const intervaloFin = new Date("2025-06-17T10:00:00");

    it("devuelve una única ventana cuando no hay eventos", () => {
        const ventanas = getAvailableWindows(intervaloInicio, intervaloFin, [], 10);
        expect(ventanas.length).toBe(51); // 60 mins - 10 + 1
        expect(ventanas[0][0]).toEqual(new Date("2025-06-17T09:00:00"));
        expect(ventanas[0][1]).toEqual(new Date("2025-06-17T09:10:00"));
    });

    it("no devuelve ventanas si no hay hueco suficiente", () => {
        const eventos: Evento[] = [evento("2025-06-17T09:00:00", "2025-06-17T10:00:00")];
        const ventanas = getAvailableWindows(intervaloInicio, intervaloFin, eventos, 10);
        expect(ventanas.length).toBe(0);
    });

    it("devuelve ventanas en hueco entre dos eventos", () => {
        const eventos: Evento[] = [
            evento("2025-06-17T09:00:00", "2025-06-17T09:15:00"),
            evento("2025-06-17T09:30:00", "2025-06-17T10:00:00"),
        ];
        const ventanas = getAvailableWindows(intervaloInicio, intervaloFin, eventos, 10);
        expect(ventanas.length).toBe(6); // 15 mins between 9:15–9:30, so 6 sliding windows
        expect(ventanas[0][0]).toEqual(new Date("2025-06-17T09:15:00"));
        expect(ventanas[5][1]).toEqual(new Date("2025-06-17T09:30:00"));
    });

    it("devuelve ventanas al principio y final si hay un evento en el medio", () => {
        const eventos: Evento[] = [evento("2025-06-17T09:20:00", "2025-06-17T09:40:00")];
        const ventanas = getAvailableWindows(intervaloInicio, intervaloFin, eventos, 10);
        const esperadas = [
            [new Date("2025-06-17T09:00:00"), new Date("2025-06-17T09:10:00")],
            [new Date("2025-06-17T09:01:00"), new Date("2025-06-17T09:11:00")],
            // ...
            [new Date("2025-06-17T09:10:00"), new Date("2025-06-17T09:20:00")],
            [new Date("2025-06-17T09:40:00"), new Date("2025-06-17T09:50:00")],
            [new Date("2025-06-17T09:41:00"), new Date("2025-06-17T09:51:00")],
            [new Date("2025-06-17T09:50:00"), new Date("2025-06-17T10:00:00")]
        ];
        expect(ventanas[0]).toEqual(esperadas[0]);
        expect(ventanas[ventanas.length - 1]).toEqual(esperadas[esperadas.length - 1]);
    });

    it("no devuelve ventanas si huecos son más cortos que la duración", () => {
        const eventos: Evento[] = [
            evento("2025-06-17T09:10:00", "2025-06-17T09:50:00")
        ];
        const ventanas = getAvailableWindows(intervaloInicio, intervaloFin, eventos, 20);
        expect(ventanas.length).toBe(0); // huecos antes y después son < 20 mins
    });

    it("maneja exactamente duración mínima igual al hueco", () => {
        const eventos: Evento[] = [evento("2025-06-17T09:10:00", "2025-06-17T09:50:00")];
        const ventanas = getAvailableWindows(intervaloInicio, intervaloFin, eventos, 10);
        expect(ventanas.length).toBe(2); // 09:00–09:10 y 09:50–10:00
        expect(ventanas[0]).toEqual([new Date("2025-06-17T09:00:00"), new Date("2025-06-17T09:10:00")]);
        expect(ventanas[1]).toEqual([new Date("2025-06-17T09:50:00"), new Date("2025-06-17T10:00:00")]);
    });

});
