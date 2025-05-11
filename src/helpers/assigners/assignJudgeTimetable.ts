import { Evento, Juez, TipoJuez } from "../../types/types";

type JudgeSchedule = {
  [key in TipoJuez]?: Juez[];
};

export function assignJudgeSchedule(judges: Juez[], events: Evento[]) {
  const judgesByType: JudgeSchedule = judges.reduce((schedule, judge) => {
    if (!schedule[judge.tipo]) {
      schedule[judge.tipo] = [];
    }
    schedule[judge.tipo]!.push(judge);
    return schedule;
  }, {} as JudgeSchedule);

  Object.entries(judgesByType).forEach(([tipo, juecesTipo]: [string, Juez[]]) => {
    const judgeType = tipo as TipoJuez
    const maxLength = juecesTipo.length
    let index = 0;
    events.forEach(event => {
        if(event.nombre === judgeType) {
            if(index >= maxLength) {
                index = 0
            }
            juecesTipo[index].horario.push(event)
            index++
        }
    })


  })
  
}
