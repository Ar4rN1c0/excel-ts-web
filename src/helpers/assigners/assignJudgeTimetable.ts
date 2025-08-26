import { Assignation, Equipo, Evento, Juez, TipoJuez } from "../../types/types";
import { hasCollision } from "../math/check";

/**
 * Enhanced judge assignment with better validation and error handling
 */
export function assignJudgeSchedule(
  judges: Juez[],
  events: Evento[],
  teams: Equipo[]
): Assignation[] {
  // Validate inputs
  if (!judges.length || !events.length || !teams.length) {
    throw new Error("Cannot assign judges: missing judges, events, or teams");
  }

  // Create deep copies to avoid modifying original data
  const judgesCopy = judges.map(judge => ({
    ...judge,
    horario: [...judge.horario] // Copy the schedule array
  }));

  // Group judges by type for efficient lookup
  const judgesByType: Record<TipoJuez, Juez[]> = {} as Record<TipoJuez, Juez[]>;
  for (const judge of judgesCopy) {
    if (!judgesByType[judge.tipo]) {
      judgesByType[judge.tipo] = [];
    }
    judgesByType[judge.tipo].push(judge);
  }

  // Collect all events that need judge assignments with their participants
  const eventsToAssign: Array<{
    event: Evento;
    participant: string;
    judgeType: TipoJuez;
  }> = [];

  // Define which events require judge assignments
  const EVENTS_REQUIRING_JUDGES: TipoJuez[] = [
    'Portfolio Técnico',
    'Portfolio de Empresa', 
    'Presentación Verbal',
    'Escrutinio',
  ];

  // Build list of events requiring judge assignments
  for (const team of teams) {
    for (const event of team.horario) {
      // Check if this event requires a judge
      const matchingJudgeType = EVENTS_REQUIRING_JUDGES.find(judgeType => 
        judgeType === event.nombre
      );

      if (!matchingJudgeType) {
        // This event doesn't require a judge, skip it
        continue;
      }

      // Verify we have judges available for this type
      if (!judgesByType[matchingJudgeType] || judgesByType[matchingJudgeType].length === 0) {
        throw new Error(`No judges of type '${matchingJudgeType}' available for assignment`);
      }

      eventsToAssign.push({
        event: { ...event }, // Create event copy to avoid reference issues
        participant: team.nombre,
        judgeType: matchingJudgeType
      });
    }
  }

  // Sort events by start time for consistent processing
  eventsToAssign.sort((a, b) => 
    a.event.start.getTime() - b.event.start.getTime()
  );

  const assignations: Assignation[] = [];
  const assignmentLog = new Set<string>(); // Track assignments to prevent duplicates

  // Process each event assignment
  for (const { event, participant, judgeType } of eventsToAssign) {
    // Create unique key for this assignment to detect duplicates
    const assignmentKey = `${judgeType}-${participant}-${event.start.toISOString()}-${event.end.toISOString()}`;
    
    if (assignmentLog.has(assignmentKey)) {
      console.warn(`Duplicate assignment detected for ${assignmentKey}, skipping`);
      continue;
    }

    // Find available judges of the required type
    const availableJudges = judgesByType[judgeType];
    if (!availableJudges || availableJudges.length === 0) {
      throw new Error(`No judges of type '${judgeType}' available`);
    }

    // Find a judge who doesn't have a collision
    let assignedJudge: Juez | null = null;

    for (const judge of availableJudges) {
      // Check if this judge has any collisions with the new event
      if (!hasCollision(judge.horario, event, 1)) {
        assignedJudge = judge;
        break;
      }
    }

    if (!assignedJudge) {
      // Provide detailed error information
      const busyJudges = availableJudges.map(j => ({
        id: j.id,
        conflictingEvents: j.horario.filter(e => {
          const evStart = e.start.getTime();
          const evEnd = e.end.getTime();
          const newStart = event.start.getTime();
          const newEnd = event.end.getTime();
          return evStart < newEnd && evEnd > newStart;
        }).map(e => `${e.nombre} (${e.start.toISOString()} - ${e.end.toISOString()})`)
      }));

      throw new Error(
        `No judge of type '${judgeType}' is available for event '${event.nombre}' ` +
        `at ${event.start.toISOString()} for team '${participant}'. ` +
        `Conflicting assignments: ${JSON.stringify(busyJudges, null, 2)}`
      );
    }

    // Make the assignment
    assignedJudge.horario.push(event);
    
    const assignment: Assignation = {
      judge: assignedJudge,
      event: event,
      team: participant
    };

    assignations.push(assignment);
    assignmentLog.add(assignmentKey);


  }

  // Validate final assignments for duplicates
  validateAssignments(assignations);

  return assignations;
}

/**
 * Validates that no judge is assigned to multiple teams at the same time
 */
function validateAssignments(assignations: Assignation[]): void {
  const judgeAssignments = new Map<string, Array<{
    event: Evento;
    team: string;
  }>>();

  // Group assignments by judge
  for (const assignment of assignations) {
    const judgeId = assignment.judge.id;
    if (!judgeAssignments.has(judgeId)) {
      judgeAssignments.set(judgeId, []);
    }
    judgeAssignments.get(judgeId)!.push({
      event: assignment.event,
      team: assignment.team
    });
  }

  // Check for time conflicts for each judge
  for (const [judgeId, assignments] of judgeAssignments) {
    for (let i = 0; i < assignments.length; i++) {
      for (let j = i + 1; j < assignments.length; j++) {
        const a = assignments[i];
        const b = assignments[j];

        const aStart = a.event.start.getTime();
        const aEnd = a.event.end.getTime();
        const bStart = b.event.start.getTime();
        const bEnd = b.event.end.getTime();

        // Check for overlap (touching endpoints are OK)
        if (aStart < bEnd && aEnd > bStart) {
          throw new Error(
            `Judge ${judgeId} has conflicting assignments: ` +
            `${a.team} (${a.event.start.toISOString()} - ${a.event.end.toISOString()}) ` +
            `conflicts with ${b.team} (${b.event.start.toISOString()} - ${b.event.end.toISOString()})`
          );
        }
      }
    }
  }

}