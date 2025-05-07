import { Evento, Juez } from "../../types/types";

export function assignJudgeSchedule(judge: Juez, events: Evento[]) {
    const category = judge.tipo

    events.forEach(evento => {
        if (evento.tipo === "Concurrent Activity") {
            switch (category) {
                case "Escrutinio":
                    if (evento.nombre === "Escrutinio") judge.horario.push(evento)
                    break;
                case "Portfolio Técnico":
                    if (evento.nombre === "Portfolio Técnico") judge.horario.push(evento)
                    break;
                case "Portfolio de Empresa":
                    if(evento.nombre === "Portfolio de empresa") judge.horario.push(evento)
                    break;
                case "Presentación verbal":
                    if(evento.nombre === "Presentación Verbal") judge.horario.push(evento)
            }
        }

    })
}