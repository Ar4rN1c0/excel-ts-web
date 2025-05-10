import { Equipo, Evento } from "../../types/types";
import { mins } from "../math/math";

export const assignRegisters = (startDate: Date, registerTime: number, teams: Equipo[], maxConcurrent: number) => {
  let currentStart = startDate;
  let iterator = 0;

  for (let team of teams) {
    if (iterator >= maxConcurrent) {
      currentStart = new Date(currentStart.getTime() + mins(registerTime));
      iterator = 0;
    }

    const register: Evento = {
      nombre: "Registro",
      duracion: registerTime,
      start: currentStart,
      end: new Date(currentStart.getTime() + mins(registerTime)),
      tipo: "Concurrent Activity"
    };

    team.horario.push(register);
    iterator++;
  }
  return new Date(currentStart.getTime() + mins(registerTime))
}