// src/timetable.ts

export interface Evento {
  nombre: string;
  duracion: number; // en minutos
  inicio?: Date;
  fin?: Date;
}

export interface Equipo {
  id: number;
  nombre: string;
  categoria: 'Entry' | 'Development' | 'Professional';
  horario: Evento[];
}

export interface Juez {
  id: number;
  tipo: 'Portfolio Técnico' | 'Portfolio de Empresa' | 'Presentación verbal';
  horario: Evento[];
}

// Flags para programar solo una vez los eventos globales
let registroScheduled = false;
let pitDisplayScheduled = false;

// Lista global de equipos, para que los eventos "globales" se apliquen a todos
let globalEquipos: Equipo[] = [];

/** Verifica que un evento no salga de la ventana [start, endWindow]. */
function assertWithinWindow(ev: Evento, start: Date, endWindow: Date) {
  if (!ev.inicio || !ev.fin) return;
  if (ev.inicio < start || ev.fin > endWindow) {
    console.warn(
      `⚠️ El evento “${ev.nombre}” (${ev.inicio.toLocaleTimeString()}–${ev.fin.toLocaleTimeString()}) ` +
      `sale de la ventana (${start.toLocaleTimeString()}–${endWindow.toLocaleTimeString()}).`
    );
  }
}

/**
 * Programa una fase para todos los equipos usando asignación de recursos (jueces),
 * sin solapamientos y minimizando huecos.
 */
function scheduleStageResource(
  equipos: Equipo[],
  stageName: string,
  getDuration: (eq: Equipo) => number,
  concurrency: number,
  endWindow: Date,
  teamNext: Map<number, Date>
): Date {
  const earliestTeam = new Date(Math.min(
    ...Array.from(teamNext.values()).map(d => d.getTime())
  ));
  const availJudge: Date[] = Array.from({ length: concurrency }, () =>
    new Date(earliestTeam)
  );
  let globalEnd = new Date(earliestTeam);

  const sortedEq = equipos.slice().sort((a, b) =>
    teamNext.get(a.id)!.getTime() - teamNext.get(b.id)!.getTime()
  );

  for (const eq of sortedEq) {
    const readyAt = teamNext.get(eq.id)!;
    let idx = 0;
    for (let j = 1; j < availJudge.length; j++) {
      if (availJudge[j] < availJudge[idx]) idx = j;
    }

    const inicio = new Date(Math.max(readyAt.getTime(), availJudge[idx].getTime()));
    const dur = getDuration(eq);
    const fin = new Date(inicio.getTime() + dur * 60000);

    const ev: Evento = { nombre: stageName, duracion: dur, inicio, fin };
    eq.horario.push(ev);
    assertWithinWindow(ev, earliestTeam, endWindow);

    availJudge[idx] = new Date(fin);
    teamNext.set(eq.id, new Date(fin));
    if (fin > globalEnd) globalEnd = new Date(fin);
  }

  return globalEnd;
}

/**
 * Genera el horario de un día (para un bloque de equipos).
 * isLastDay controla si al final se programa la Ceremonia de Clausura.
 *
 * Config debe contener:
 *   - "Nº de equipos que se clasifican": number
 *   - "rounds": { Entry: number, Development: number, Professional: number }
 *   - "Nº de personal para el registro": number
 *   - "Nº de Jueces para el escrutinio": number
 *   - "Nº de Jueces para el portfolio técnico": number
 *   - "Nº de Jueces para el portfolio de empresa": number
 *   - "Nº de Jueces para la presentación verbal": number
 */
export function asignarHorarios(
  equipos: Equipo[],
  config: any,
  start: Date,
  endWindow: Date,
  isLastDay = false
): Date {
  // ──────────────────────────────────────────────────────────────────────────
  // 1) Fusionamos siempre el array entrante con globalEquipos, eliminando duplicados por id.
  //    Así globalEquipos contiene *todos* los equipos antes de programar eventos.
  globalEquipos = Array.from(
    new Map(
      [...globalEquipos, ...equipos].map(eq => [eq.id, eq])
    ).values()
  );
  // ──────────────────────────────────────────────────────────────────────────

  if (typeof config["Nº de equipos que se clasifican"] !== "number") {
    throw new Error('Falta el parámetro "Nº de equipos que se clasifican".');
  }
  if (!config.rounds
    || typeof config.rounds.Entry  !== "number"
    || typeof config.rounds.Development !== "number"
    || typeof config.rounds.Professional !== "number"
  ) {
    throw new Error('Falta el objeto "rounds" con Entry, Development y Professional.');
  }

  const dayStart = new Date(start); dayStart.setSeconds(0, 0);
  const dayEnd   = new Date(endWindow); dayEnd.setSeconds(0, 0); dayEnd.setMilliseconds(0);

  // Duraciones (minutos)
  const DUR_REG              = 5;
  const DUR_INAU             = 20;
  const DUR_CARRERA_ENTRY    = 7;
  const DUR_CARRERA_DEVPROF  = 10;
  const DUR_PIT_ENTRY        = 60;
  const DUR_PIT_DEVPROF      = 65;

  const DUR_ESCR_ENTRY_DEV   = 20;
  const DUR_ESCR_PROF        = 25;
  const DUR_PRES_ENTRY       = 10;
  const DUR_PRES_DEVPROF     = 20;
  const DUR_TECH_ENTRY       = 10;
  const DUR_TECH_DEVPROF     = 15;
  const DUR_EMP_ENTRY        = 15;
  const DUR_EMP_DEVPROF      = 10;

  let cursor = new Date(dayStart);

  // 2) Registro + Ceremonia de Inauguración (solo una vez, el primer día)
  if (!registroScheduled) {
    const personal = config["Nº de personal para el registro"] as number || 1;
    let lastRegFin = new Date(cursor);

    globalEquipos.forEach((eq, i) => {
      const inicio = new Date(cursor.getTime() + Math.floor(i / personal) * DUR_REG * 60000);
      const fin    = new Date(inicio.getTime() + DUR_REG * 60000);
      eq.horario.push({ nombre: 'Registro', duracion: DUR_REG, inicio, fin });
      assertWithinWindow({ nombre: 'Registro', duracion: DUR_REG, inicio, fin }, dayStart, dayEnd);
      if (fin > lastRegFin) lastRegFin = fin;
    });

    const iniI = new Date(lastRegFin);
    const finI = new Date(iniI.getTime() + DUR_INAU * 60000);
    globalEquipos.forEach(eq => {
      eq.horario.push({ nombre: 'Ceremonia de Inauguración', duracion: DUR_INAU, inicio: iniI, fin: finI });
      assertWithinWindow({ nombre: 'Ceremonia de Inauguración', duracion: DUR_INAU, inicio: iniI, fin: finI }, dayStart, dayEnd);
    });

    cursor = finI;
    registroScheduled = true;
  }

  // 3) Montaje Pit Display (solo una vez, el primer día)
  if (!pitDisplayScheduled) {
    const iniP = new Date(cursor);
    globalEquipos.forEach(eq => {
      const dur = eq.categoria === 'Entry' ? DUR_PIT_ENTRY : DUR_PIT_DEVPROF;
      const fin = new Date(iniP.getTime() + dur * 60000);
      eq.horario.push({ nombre: 'Montaje del Pit Display', duracion: dur, inicio: iniP, fin });
      assertWithinWindow({ nombre: 'Montaje del Pit Display', duracion: dur, inicio: iniP, fin }, dayStart, dayEnd);
    });
    cursor = new Date(iniP.getTime() + DUR_PIT_DEVPROF * 60000);
    pitDisplayScheduled = true;
  }

  // 4) Preparamos el mapa teamNext según el último evento antes de este día
  const teamNext = new Map<number, Date>();
  equipos.forEach(eq => {
    const prevEvents = eq.horario.filter(ev => ev.fin! <= dayStart);
    const lastPrev    = prevEvents.length
      ? prevEvents.reduce((a, b) => a.fin! > b.fin! ? a : b).fin!
      : dayStart;
    teamNext.set(eq.id, new Date(lastPrev));
  });

  // 5) Evaluaciones sucesivas con los jueces disponibles
  const nEscr   = config["Nº de Jueces para el escrutinio"] as number || 1;
  const nTec    = config["Nº de Jueces para el portfolio técnico"] as number  || 1;
  const nEmpJ   = config["Nº de Jueces para el portfolio de empresa"] as number    || 1;
  const nVerbal = config["Nº de Jueces para la presentación verbal"] as number      || 1;

  const escrutinioDuration    = (eq: Equipo) => eq.categoria === 'Professional' ? DUR_ESCR_PROF   : DUR_ESCR_ENTRY_DEV;
  const techPortfolioDuration = (eq: Equipo) => eq.categoria === 'Entry'        ? DUR_TECH_ENTRY   : DUR_TECH_DEVPROF;
  const empPortfolioDuration  = (eq: Equipo) => eq.categoria === 'Entry'        ? DUR_EMP_ENTRY    : DUR_EMP_DEVPROF;
  const presDuration          = (eq: Equipo) => eq.categoria === 'Entry'        ? DUR_PRES_ENTRY   : DUR_PRES_DEVPROF;

  scheduleStageResource(equipos, 'Escrutinio',           escrutinioDuration,    nEscr,   dayEnd, teamNext);
  scheduleStageResource(equipos, 'Portfolio Técnico',    techPortfolioDuration, nTec,    dayEnd, teamNext);
  scheduleStageResource(equipos, 'Portfolio de Empresa', empPortfolioDuration,  nEmpJ,   dayEnd, teamNext);
  scheduleStageResource(equipos, 'Presentación verbal',  presDuration,          nVerbal, dayEnd, teamNext);

  // 6) Carreras clasificatorias
  let raceCursor = new Date(Math.max(...Array.from(teamNext.values()).map(d => d.getTime())));
  let counter    = 1;

  const planCat = (cat: 'Entry' | 'Development' | 'Professional', rounds: number) => {
    const dur  = cat === 'Entry' ? DUR_CARRERA_ENTRY : DUR_CARRERA_DEVPROF;
    const list = equipos.filter(e => e.categoria === cat);
    for (let r = 0; r < rounds; r++) {
      for (let i = 0; i < list.length; i += 2) {
        const ini = new Date(raceCursor);
        const fin = new Date(ini.getTime() + dur * 60000);
        const name = i + 1 < list.length
          ? `Carrera Clasificatoria ${counter}`
          : `Carrera Clasificatoria ${counter} (bye)`;
        const ev: Evento = { nombre: name, duracion: dur, inicio: ini, fin };
        list[i].horario.push(ev);
        list[i + 1]?.horario.push(ev);
        assertWithinWindow(ev, dayStart, dayEnd);
        raceCursor = fin;
        counter++;
      }
    }
  };

  planCat('Entry',        config.rounds.Entry);
  planCat('Development',  config.rounds.Development);
  planCat('Professional', config.rounds.Professional);

  // 7) Reserva de Eliminatorias (todos los equipos, bloque global)
  const clasif    = config["Nº de equipos que se clasifican"] as number;
  const totalElim = Math.max(0, clasif - 1);
  if (totalElim > 0) {
    const iniR = new Date(raceCursor);
    let finR   = new Date(iniR.getTime() + totalElim * DUR_CARRERA_DEVPROF * 60000);
    if (finR > dayEnd) {
      console.warn(`⚠️ La Reserva Eliminatorias excede la ventana y se recorta al cierre.`);
      finR = new Date(dayEnd);
    }
    const ev: Evento = {
      nombre: 'Reserva Eliminatorias',
      duracion: (finR.getTime() - iniR.getTime()) / 60000,
      inicio: iniR,
      fin: finR
    };
    globalEquipos.forEach(eq => {
      eq.horario.push(ev);
      assertWithinWindow(ev, dayStart, dayEnd);
    });
    raceCursor = finR;
  }

  // 8) Ceremonia de Clausura (solo en el último día)
  if (isLastDay) {
    const iniC = new Date(raceCursor);
    const finC = new Date(iniC.getTime() + 90 * 60000);
    globalEquipos.forEach(eq => {
      eq.horario.push({ nombre: 'Ceremonia de Clausura', duracion: 90, inicio: iniC, fin: finC });
      assertWithinWindow({ nombre: 'Ceremonia de Clausura', duracion: 90, inicio: iniC, fin: finC }, dayStart, dayEnd);
    });
    raceCursor = finC;
  }

  return raceCursor;
}

/**
 * Genera el horario para jueces (idéntico cada día).
 */
export function asignarHorariosJueces(
  equipos: Equipo[],
  config: any,
  globalEvalStarts: Date[]
): Juez[] {
  const hasProf = equipos.some(e => e.categoria === 'Professional');
  const dEscr   = hasProf ? 25 : 20;  // acorde a duraciones actualizadas
  const dPres   = 20;
  const dTec    = 15;
  const dEmp    = 10;

  const nVerbal = config["Nº de Jueces para la presentación verbal"] as number || 0;
  const nTec    = config["Nº de Jueces para el portfolio técnico"]       as number || 0;
  const nEmpJ   = config["Nº de Jueces para el portfolio de empresa"]    as number || 0;

  const jueces: Juez[] = [];
  for (let i = 1; i <= nVerbal; i++)  jueces.push({ id: i, tipo: 'Presentación verbal', horario: [] });
  for (let i = 1; i <= nTec;    i++)  jueces.push({ id: i, tipo: 'Portfolio Técnico',    horario: [] });
  for (let i = 1; i <= nEmpJ;   i++)  jueces.push({ id: i, tipo: 'Portfolio de Empresa', horario: [] });

  globalEvalStarts.forEach(start => {
    let t = new Date(start.getTime() + dEscr * 60000);
    const t1 = new Date(t.getTime() + dPres * 60000);
    for (let i = 0; i < nVerbal; i++) {
      jueces[i].horario.push({ nombre: 'Evaluación Presentación verbal', duracion: dPres, inicio: t, fin: t1 });
    }
    t = t1;
    const t2 = new Date(t.getTime() + dTec * 60000);
    for (let i = nVerbal; i < nVerbal + nTec; i++) {
      jueces[i].horario.push({ nombre: 'Evaluación Portfolio Técnico', duracion: dTec, inicio: t, fin: t2 });
    }
    t = t2;
    const t3 = new Date(t.getTime() + dEmp * 60000);
    for (let i = nVerbal + nTec; i < nVerbal + nTec + nEmpJ; i++) {
      jueces[i].horario.push({ nombre: 'Evaluación Portfolio de Empresa', duracion: dEmp, inicio: t, fin: t3 });
    }
  });

  return jueces;
}

// Regionales: 1 dia 9h 
// Solo una charla inicio (Solo el primer dia)

// 30 equipos
