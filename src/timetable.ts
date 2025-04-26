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
  categoria: 'Entry'|'Development'|'Professional';
  horario:   Evento[];
}

export interface Juez {
  id:     number;
  tipo:   'Portfolio Técnico'|'Portfolio de Empresa'|'Presentación verbal';
  horario: Evento[];
}

/**
 * Asigna todos los bloques dentro de [start, endWindow].
 * Devuelve la hora de fin de inauguración (para los jueces).
 * Sólo añade la Ceremonia de Clausura si isLastDay === true.
 */
export function asignarHorarios(
  equipos: Equipo[],
  config: any,
  start: Date,
  endWindow: Date,
  isLastDay = false
): Date {
  // 1) Registro (5′)
  const pers = config["Nº de personal para el registro"];
  equipos.forEach((eq, i) => {
    const slot = Math.floor(i / pers);
    const ini  = new Date(start.getTime() + slot * 5 * 60000);
    eq.horario.push({
      nombre:   'Registro',
      duracion: 5,
      inicio:   ini,
      fin:      new Date(ini.getTime() + 5 * 60000)
    });
  });
  const finReg = new Date(Math.max(
    ...equipos.map(e => e.horario.find(ev => ev.nombre === 'Registro')!.fin!.getTime())
  ));

  // 2) Charla/Presentación (20′)
  const iniChar = finReg;
  const finChar = new Date(iniChar.getTime() + 20 * 60000);
  equipos.forEach(e =>
    e.horario.push({
      nombre:   'Charla/Presentación',
      duracion: 20,
      inicio:   iniChar,
      fin:      finChar
    })
  );

  // 3) Ceremonia de Inauguración (20′)
  const iniInau = finChar;
  const finInau = new Date(iniInau.getTime() + 20 * 60000);
  equipos.forEach(e =>
    e.horario.push({
      nombre:   'Ceremonia de Inauguración',
      duracion: 20,
      inicio:   iniInau,
      fin:      finInau
    })
  );

  const globalEvalStart = finInau;

  // 4) Evaluaciones individuales
  equipos.forEach(eq => {
    let cur   = new Date(finInau.getTime());
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
      const ini = new Date(cur.getTime());
      eq.horario.push({
        nombre,
        duracion: dur,
        inicio:   ini,
        fin:      new Date(ini.getTime() + dur * 60000)
      });
      cur = new Date(cur.getTime() + dur * 60000);
    }
    (eq as any).individualEnd = cur;
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

  // 6) Carreras clasificatorias (una a la vez, 10′ c/u)
  const raceDur = config["Duración Carrera"] || 10;
  let cursor = new Date(Math.max(
    ...equipos.map(e =>
      e.categoria === 'Entry'
        ? (e as any).individualEnd.getTime()
        : finPitMax.getTime()
    )
  ));
  let counter = 1;
  const cats: ('Entry'|'Development'|'Professional')[] = ['Entry','Development','Professional'];
  for (const cat of cats) {
    const lista = equipos.filter(e => e.categoria === cat);
    const nRnd  = config.rounds[cat] || 0;
    for (let r = 1; r <= nRnd; r++) {
      for (let i = 0; i < lista.length; i += 2) {
        const ini = new Date(cursor.getTime());
        const fin = new Date(ini.getTime() + raceDur * 60000);
        const nom = (i + 1 < lista.length)
          ? `Carrera Clasificatoria ${counter}`
          : `Carrera Clasificatoria ${counter} (bye)`;
        const ev = { nombre: nom, duracion: raceDur, inicio: ini, fin };
        lista[i].horario.push(ev);
        if (i + 1 < lista.length) lista[i+1].horario.push(ev);
        counter++;
        cursor = fin;
      }
    }
  }

  // 7) Reserva de Eliminatorias (nº_clasificados × 10′)
  const iniR = new Date(cursor.getTime());
  const finR = new Date(iniR.getTime() + config["Tiempo Eliminatorias"] * 60000);
  equipos.forEach(e =>
    e.horario.push({
      nombre:   'Reserva Eliminatorias',
      duracion: config["Tiempo Eliminatorias"],
      inicio:   iniR,
      fin:      finR
    })
  );
  cursor = finR;

  // 8) Ceremonia de Clausura (90′) — sólo último día
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
      console.warn(`Clausura termina ${finC.toLocaleString()} > ventana acaba ${endWindow.toLocaleString()}`);
    }
  }

  return globalEvalStart;
}

/**
 * Genera el horario para cada juez, un bloque diario según su tipo.
 */
export function asignarHorariosJueces(
  equipos: Equipo[],
  config: any,
  globalEvalStarts: Date[]
): Juez[] {
  const dEscr   = equipos.some(e => e.categoria === 'Professional') ? 25 : 20;
  const dPres   = 20;
  const dTec    = 15;
  const dEmp    = 10;
  const nVerbal = config["Nº de Jueces para la presentación verbal"];
  const nTec    = config["Nº de Jueces para el portfolio técnico"];
  const nEmp    = config["Nº de Jueces para el portfolio de empresa"];

  const jueces: Juez[] = [];
  for (let i = 1; i <= nVerbal; i++)    jueces.push({ id: i, tipo:'Presentación verbal',    horario: [] });
  for (let i = 1; i <= nTec;    i++)    jueces.push({ id: i, tipo:'Portfolio Técnico',     horario: [] });
  for (let i = 1; i <= nEmp;    i++)    jueces.push({ id: i, tipo:'Portfolio de Empresa',   horario: [] });

  globalEvalStarts.forEach(t0 => {
    const t1 = new Date(t0.getTime() + dEscr * 60000);
    const t2 = new Date(t1.getTime() + dPres * 60000);
    const t3 = new Date(t2.getTime() + dTec  * 60000);
    const t4 = new Date(t3.getTime() + dEmp  * 60000);

    for (let i = 0; i < nVerbal; i++) {
      jueces[i].horario.push({
        nombre:   'Evaluación Presentación verbal',
        duracion: dPres,
        inicio:   t1,
        fin:      t2
      });
    }
    for (let i = nVerbal; i < nVerbal + nTec; i++) {
      jueces[i].horario.push({
        nombre:   'Evaluación Portfolio Técnico',
        duracion: dTec,
        inicio:   t2,
        fin:      t3
      });
    }
    for (let i = nVerbal + nTec; i < nVerbal + nTec + nEmp; i++) {
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
