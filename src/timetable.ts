// src/timetable.ts

export interface Evento {
  nombre:   string;
  duracion: number; // en minutos
  inicio?:  Date;
  fin?:     Date;
}

export interface Equipo {
  id:        number;
  nombre:    string;
  categoria: 'Entry' | 'Development' | 'Professional';
  horario:   Evento[];
}

export interface Juez {
  id:     number;
  tipo:   'Portfolio Técnico' | 'Portfolio de Empresa' | 'Presentación verbal';
  horario: Evento[];
}

/**
 * Asigna todos los bloques dentro de [start, endWindow].
 * Devuelve la hora de fin de la Ceremonia de Inauguración (para uso en jueces).
 * Sólo añade la Ceremonia de Clausura si isLastDay === true.
 */
export function asignarHorarios(
  equipos: Equipo[],
  config: any,
  start: Date,
  endWindow: Date,
  isLastDay = false
): Date {
  // Duraciones fijas (minutos)
  const DUR_REG      = 5;
  const DUR_PAUSA    = 20;
  const DUR_INAU     = 20;
  const DUR_CARRERA  = config["Duración Carrera"] ?? 7;
  const NUM_CLAS     = config["Nº de equipos que se clasifican"] ?? 0;

  // 1) Registro
  const pers = config["Nº de personal para el registro"] || 1;
  equipos.forEach((eq, i) => {
    const slot = Math.floor(i / pers);
    const ini  = new Date(start.getTime() + slot * DUR_REG * 60000);
    eq.horario.push({
      nombre:   'Registro',
      duracion: DUR_REG,
      inicio:   ini,
      fin:      new Date(ini.getTime() + DUR_REG * 60000)
    });
  });
  const finReg = new Date(Math.max(
    ...equipos.map(e => e.horario.find(ev => ev.nombre === 'Registro')!.fin!.getTime())
  ));

  // 2) Charla/Presentación (pausa post-registro)
  const iniChar = finReg;
  const finChar = new Date(iniChar.getTime() + DUR_PAUSA * 60000);
  equipos.forEach(e =>
    e.horario.push({
      nombre:   'Charla/Presentación',
      duracion: DUR_PAUSA,
      inicio:   iniChar,
      fin:      finChar
    })
  );

  // 3) Ceremonia de Inauguración
  const iniInau = finChar;
  const finInau = new Date(iniInau.getTime() + DUR_INAU * 60000);
  equipos.forEach(e =>
    e.horario.push({
      nombre:   'Ceremonia de Inauguración',
      duracion: DUR_INAU,
      inicio:   iniInau,
      fin:      finInau
    })
  );
  const globalEvalStart = finInau;

  // 4) Evaluaciones individuales
  equipos.forEach(eq => {
    let cursor = new Date(globalEvalStart.getTime());
    const dEscr = eq.categoria === 'Professional' ? 25 : 20;
    const dPres = eq.categoria === 'Entry'        ? 10 : 20;
    const dTec  = eq.categoria === 'Entry'        ? 10 : 15;
    const dEmp  = eq.categoria === 'Entry'        ? 15 : 10;

    for (const [nombre, dur] of [
      ['Escrutinio', dEscr],
      ['Presentación verbal', dPres],
      ['Portfolio Técnico', dTec],
      ['Portfolio de Empresa', dEmp],
    ] as [string, number][]) {
      const ini = new Date(cursor.getTime());
      eq.horario.push({
        nombre,
        duracion: dur,
        inicio:   ini,
        fin:      new Date(ini.getTime() + dur * 60000)
      });
      cursor = new Date(cursor.getTime() + dur * 60000);
    }
    (eq as any).individualEnd = cursor;
  });

  // 5) Montaje del Pit Display (todos a la vez)
  const finEval = new Date(Math.max(
    ...equipos.map(e => (e as any).individualEnd.getTime())
  ));
  const iniPit = finEval;
  equipos.forEach(eq => {
    const durPit = eq.categoria === 'Entry' ? 60 : 65;
    eq.horario.push({
      nombre:   'Montaje del Pit Display',
      duracion: durPit,
      inicio:   iniPit,
      fin:      new Date(iniPit.getTime() + durPit * 60000)
    });
  });
  const finPitMax = new Date(iniPit.getTime() + 65 * 60000);

  // 6) Carreras clasificatorias (una a la vez)
  let cursor = new Date(Math.max(
    ...equipos.map(e =>
      e.categoria === 'Entry'
        ? (e as any).individualEnd.getTime()
        : finPitMax.getTime()
    )
  ));
  let counter = 1;
  for (const cat of ['Entry','Development','Professional'] as const) {
    const lista = equipos.filter(e => e.categoria === cat);
    const nRnd  = config.rounds?.[cat] || 0;
    for (let r = 1; r <= nRnd; r++) {
      for (let i = 0; i < lista.length; i += 2) {
        const ini = new Date(cursor.getTime());
        const fin = new Date(ini.getTime() + DUR_CARRERA * 60000);
        const nom = (i + 1 < lista.length)
          ? `Carrera Clasificatoria ${counter}`
          : `Carrera Clasificatoria ${counter} (bye)`;
        const ev = { nombre: nom, duracion: DUR_CARRERA, inicio: ini, fin };
        lista[i].horario.push(ev);
        if (i + 1 < lista.length) lista[i+1].horario.push(ev);
        counter++;
        cursor = fin;
      }
    }
  }

  // 7) Reserva de Eliminatorias
  const totalElims  = NUM_CLAS > 1 ? NUM_CLAS - 1 : 0;
  const elimTimeMin = totalElims * DUR_CARRERA;
  const iniR = new Date(cursor.getTime());
  const finR = new Date(iniR.getTime() + elimTimeMin * 60000);
  equipos.forEach(e =>
    e.horario.push({
      nombre:   'Reserva Eliminatorias',
      duracion: elimTimeMin,
      inicio:   iniR,
      fin:      finR
    })
  );
  cursor = finR;

  // 8) Ceremonia de Clausura
  if (isLastDay) {
    const iniC = new Date(cursor.getTime());
    const finC = new Date(iniC.getTime() + 90 * 60000);
    equipos.forEach(e =>
      e.horario.push({
        nombre:   'Ceremonia de Clausura',
        duracion: 90,
        inicio:   iniC,
        fin:      finC
      })
    );
    if (finC.getTime() > endWindow.getTime()) {
      console.warn(
        `La clausura termina fuera de la ventana: ` +
        `${finC.toLocaleString()} > ${endWindow.toLocaleString()}`
      );
    }
  }

  return globalEvalStart;
}

/**
 * Genera el horario para cada juez, un bloque por cada día de evaluación.
 */
export function asignarHorariosJueces(
  equipos: Equipo[],
  config: any,
  globalEvalStarts: Date[]
): Juez[] {
  // Duraciones de bloque jueces
  const hasProf = equipos.some(e => e.categoria === 'Professional');
  const dEscr   = hasProf ? 25 : 20;
  const dPres   = 20;
  const dTec    = 15;
  const dEmp    = 10;

  // Nº de jueces por tipo
  const nVerbal = config["Nº de Jueces para la presentación verbal"] || 0;
  const nTec    = config["Nº de Jueces para el portfolio técnico"]     || 0;
  const nEmpJ   = config["Nº de Jueces para el portfolio de empresa"]   || 0;

  // Crear jueces
  const jueces: Juez[] = [];
  for (let i = 1; i <= nVerbal; i++)
    jueces.push({ id: i, tipo:'Presentación verbal',  horario: [] });
  for (let i = 1; i <= nTec;    i++)
    jueces.push({ id: i, tipo:'Portfolio Técnico',   horario: [] });
  for (let i = 1; i <= nEmpJ;   i++)
    jueces.push({ id: i, tipo:'Portfolio de Empresa', horario: [] });

  // Asignar un bloque diario a cada juez
  globalEvalStarts.forEach(t0 => {
    const t1 = new Date(t0.getTime() + dEscr  * 60000);
    const t2 = new Date(t1.getTime() + dPres  * 60000);
    const t3 = new Date(t2.getTime() + dTec   * 60000);
    const t4 = new Date(t3.getTime() + dEmp   * 60000);

    // Presentación verbal
    for (let i = 0; i < nVerbal; i++) {
      jueces[i].horario.push({
        nombre:   'Evaluación Presentación verbal',
        duracion: dPres,
        inicio:   t1,
        fin:      t2
      });
    }
    // Portfolio Técnico
    for (let i = nVerbal; i < nVerbal + nTec; i++) {
      jueces[i].horario.push({
        nombre:   'Evaluación Portfolio Técnico',
        duracion: dTec,
        inicio:   t2,
        fin:      t3
      });
    }
    // Portfolio de Empresa
    for (let i = nVerbal + nTec; i < nVerbal + nTec + nEmpJ; i++) {
      jueces[i].horario.push({
        nombre:   'Evaluación Portfolio de Empresa',
        duracion: dEmp,
        inicio:   t3,
        fin:      t4
      });
    }
  });

  return jueces;
}
