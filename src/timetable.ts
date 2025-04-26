// timetable.ts

export interface Evento {
  nombre: string;
  duracion: number; // en minutos
  inicio?: Date;
  fin?: Date;
}

export interface Equipo {
  id: number;
  nombre: string;
  // La categoría es una de: 'Entry', 'Development' o 'Professional'
  categoria: 'Entry' | 'Development' | 'Professional';
  horario: Evento[];
}

export interface Juez {
  id: number;
  tipo: 'Portfolio Técnico' | 'Portfolio de Empresa' | 'Presentación verbal';
  horario: Evento[];
}

/**
 * Asigna a cada equipo todos los bloques:
 *  1) Registro
 *  2) Charla/Presentación
 *  3) Ceremonia de Inauguración
 *  4) Evaluaciones (scrutinio, verbal, técnico, empresa)
 *  5) Montaje global de Pit Display
 *  6) N rondas de Carreras clasificatorias
 *  7) Reserva para eliminatorias
 *  8) Ceremonia de Clausura
 */
export function asignarHorarios(
  equipos: Equipo[],
  config: any,
  fechaInicio: Date
): void {
  // 1) Registro (5′ por equipo, slots paralelos)
  const personalRegistro = config["Nº de personal para el registro"] || 1;
  equipos.forEach((eq, i) => {
    const slot = Math.floor(i / personalRegistro);
    const inicio = new Date(fechaInicio.getTime() + slot * 5 * 60000);
    eq.horario.push({
      nombre: 'Registro',
      duracion: 5,
      inicio,
      fin:    new Date(inicio.getTime() + 5 * 60000)
    });
  });

  // 2) Fin global de registro
  const finRegistro = new Date(Math.max(
    ...equipos.map(e =>
      e.horario.find(ev => ev.nombre === 'Registro')!.fin!.getTime()
    )
  ));

  // 3) Charla/Presentación (20′)
  const inicioCharla = new Date(finRegistro.getTime());
  const finCharla    = new Date(inicioCharla.getTime() + 20 * 60000);
  equipos.forEach(e =>
    e.horario.push({
      nombre:   'Charla/Presentación',
      duracion: 20,
      inicio:   inicioCharla,
      fin:      finCharla
    })
  );

  // 4) Ceremonia de Inauguración (20′)
  const inicioInaug = new Date(finCharla.getTime());
  const finInaug    = new Date(inicioInaug.getTime() + 20 * 60000);
  equipos.forEach(e =>
    e.horario.push({
      nombre:   'Ceremonia de Inauguración',
      duracion: 20,
      inicio:   inicioInaug,
      fin:      finInaug
    })
  );

  // ➤ Guardamos este fin de inauguración para los jueces
  config.globalEvalStart = finInaug;

  // 5) Evaluaciones individuales (serie por equipo)
  equipos.forEach(eq => {
    let cursor = new Date(finInaug.getTime());
    const durEscr = eq.categoria === 'Professional' ? 25 : 20;
    const durPres = eq.categoria === 'Entry'        ? 10 : 20;
    const durTec  = eq.categoria === 'Entry'        ? 10 : 15;
    const durEmp  = eq.categoria === 'Entry'        ? 15 : 10;

    for (const [nombre, dur] of [
      ['Escrutinio',           durEscr],
      ['Presentación verbal',  durPres],
      ['Portfolio Técnico',    durTec],
      ['Portfolio de Empresa', durEmp]
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

  // 6) Fin global de evaluaciones individuales
  const finEvalGlobal = new Date(Math.max(
    ...equipos.map(e => (e as any).individualEnd.getTime())
  ));

  // 7) Montaje de Pit Display (todos juntos)
  const inicioPit = new Date(finEvalGlobal.getTime());
  equipos.forEach(eq => {
    const durPit = eq.categoria === 'Entry' ? 60 : 65;
    eq.horario.push({
      nombre:   'Montaje del Pit Display',
      duracion: durPit,
      inicio:   inicioPit,
      fin:      new Date(inicioPit.getTime() + durPit * 60000)
    });
  });
  const finPitGeneral = new Date(inicioPit.getTime() + 65 * 60000);

  // 8) Carreras clasificatorias: N rondas
  const nRondas = config["Nº de carreras clasificatorias"] || 1;
  const baseRaceStart = new Date(Math.max(
    ...equipos.map(e =>
      e.categoria === 'Entry'
        ? (e as any).individualEnd.getTime()
        : finPitGeneral.getTime()
    )
  ));
  let raceCursor = new Date(baseRaceStart.getTime());
  let contador   = 1;
  const cats: ('Entry'|'Development'|'Professional')[] = ['Entry','Development','Professional'];

  for (let r = 1; r <= nRondas; r++) {
    for (const cat of cats) {
      const lista = equipos.filter(e => e.categoria === cat);
      for (let i = 0; i < lista.length; i += 2) {
        const ini = new Date(raceCursor.getTime());
        const fin = new Date(ini.getTime() + 10 * 60000);
        const nom = i + 1 < lista.length
          ? `Carrera Clasificatoria ${contador}`
          : `Carrera Clasificatoria ${contador} (bye)`;
        const ev  = { nombre: nom, duracion: 10, inicio: ini, fin };
        lista[i].horario.push(ev);
        if (i + 1 < lista.length) lista[i + 1].horario.push(ev);
        contador++;
        raceCursor = fin;
      }
    }
  }

  // 9) Reserva para eliminatorias
  const reservaMin = config["Tiempo Eliminatorias"] || 0;
  const inicioRes  = new Date(raceCursor.getTime());
  const finRes     = new Date(inicioRes.getTime() + reservaMin * 60000);
  equipos.forEach(e =>
    e.horario.push({
      nombre:   'Reserva Eliminatorias',
      duracion: reservaMin,
      inicio:   inicioRes,
      fin:      finRes
    })
  );
  raceCursor = finRes;

  // 10) Ceremonia de Clausura (90′)
  const inicioCl  = new Date(raceCursor.getTime());
  const finCl     = new Date(inicioCl.getTime() + 90 * 60000);
  equipos.forEach(e =>
    e.horario.push({
      nombre:   'Ceremonia de Clausura',
      duracion: 90,
      inicio:   inicioCl,
      fin:      finCl
    })
  );
}


/**
 * Asigna a los jueces sus bloques de evaluación,
 * tomando config.globalEvalStart como punto cero.
 */
export function asignarHorariosJueces(
  equipos: Equipo[],
  config: any,
  globalEvalStart: Date
): Juez[] {
  // Aseguramos t0: preferimos el parámetro, si no, el guardado en config
  const t0 = globalEvalStart || config.globalEvalStart;

  // Duraciones de cada bloque
  const durEscr = equipos.some(e => e.categoria === 'Professional') ? 25 : 20;
  const durPres = 20;
  const durTec  = 15;
  const durEmp  = 10;

  // Fechas límite de cada fase
  const t1 = new Date(t0.getTime() + durEscr * 60000);
  const t2 = new Date(t1.getTime() + durPres * 60000);
  const t3 = new Date(t2.getTime() + durTec  * 60000);
  const t4 = new Date(t3.getTime() + durEmp  * 60000);

  const jueces: Juez[] = [];

  // 1) Jueces de Presentación verbal
  for (let i = 1, n = config["Nº de Jueces para la presentación verbal"] || 0; i <= n; i++) {
    jueces.push({
      id:     i,
      tipo:  'Presentación verbal',
      horario: [{
        nombre:   'Evaluación Presentación verbal',
        duracion: durPres,
        inicio:   t1,
        fin:      t2
      }]
    });
  }

  // 2) Jueces de Portfolio Técnico
  for (let i = 1, n = config["Nº de Jueces para el portfolio técnico"] || 0; i <= n; i++) {
    jueces.push({
      id:     i,
      tipo:  'Portfolio Técnico',
      horario: [{
        nombre:   'Evaluación Portfolio Técnico',
        duracion: durTec,
        inicio:   t2,
        fin:      t3
      }]
    });
  }

  // 3) Jueces de Portfolio de Empresa
  for (let i = 1, n = config["Nº de Jueces para el portfolio de empresa"] || 0; i <= n; i++) {
    jueces.push({
      id:     i,
      tipo:  'Portfolio de Empresa',
      horario: [{
        nombre:   'Evaluación Portfolio de Empresa',
        duracion: durEmp,
        inicio:   t3,
        fin:      t4
      }]
    });
  }

  return jueces;
}
