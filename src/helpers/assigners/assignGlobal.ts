import { Equipo, Evento } from "../../types/types"
import { mins } from "../math/math"

export const assignGlobalEvent = (name: string, startDate: Date, duration: number, teams: Equipo[]) => {
    const end = new Date(startDate.getTime() + mins(duration))
    const globalEvent: Evento = {
        duracion: duration,
        nombre: name,
        start: startDate,
        end,
        tipo: "Global Event"
    }
    teams.forEach(team => team.horario.push(globalEvent))
    return globalEvent.end
}