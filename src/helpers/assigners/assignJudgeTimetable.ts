import { Assignation, Equipo, Evento, Juez } from "../../types/types";
import { hasCollision } from "../math/check";


export function assignJudgeSchedule(
  judges: Juez[],
  events: Evento[],
  teams: Equipo[]
): Assignation[] {
  // Group judges by type
  const eventsByJudgeType: Record<string, Evento[]> = {

  }
  for (const event of events) {
    for (const judge of judges) {
      if (judge.tipo === event.nombre) {
        if (!eventsByJudgeType[judge.tipo]) {
          eventsByJudgeType[judge.tipo] = []
        }
        eventsByJudgeType[judge.tipo].push(event)
      }
    }
  }

  const eventWithParticipantByJudge: Record<string, { event: Evento, participant: string, type: string }[]> = {}
  for (const judge of Object.keys(eventsByJudgeType)) {
    const typeEventTeamPair = []
    for (const team of teams) {
      const event = team.horario.filter(ev => ev.nombre === judge)[0]
      if (!event) continue
      typeEventTeamPair.push({
        event,
        participant: team.nombre,
        type: event.nombre
      })
    }
    eventWithParticipantByJudge[judge] = typeEventTeamPair

  }

  const judgesByType: Record<string, Juez[]> = {}
  for (const judge of judges) {
    if (!judgesByType[judge.tipo]) judgesByType[judge.tipo] = []
    judgesByType[judge.tipo].push(judge)
  }
  const assignations = []
  for (const [tipo, eventsWithParticipant] of Object.entries(eventWithParticipantByJudge)) {
    eventsWithParticipant.sort((a, b) =>
      new Date(a.event.start).getTime() - new Date(b.event.start).getTime()
    );

    for (const evt of eventsWithParticipant) {
      // look for a judge whose horario doesn’t collide
      const freeJudge = judgesByType[tipo].find(j =>
        !hasCollision(j.horario, evt.event, /* maxConcur=1 for a single judge */ 1)
      );
      if (!freeJudge) {
        throw new Error(`No judge free to take event at ${evt.event.start}`);
      }
      freeJudge.horario.push(evt.event);
      assignations.push({ judge: freeJudge, event: evt.event, team: evt.participant });
    }

  }

  return assignations
}
