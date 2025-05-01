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

// Flag para que la inauguración sólo se programe la primera vez
let inauguracionScheduled = false;

/**
 * Verifica que un evento no salga de la ventana [start, endWindow].
 * Lanza Error si lo hace.
 */
function assertWithinWindow(ev: Evento, start: Date, endWindow: Date) {
  if (!ev.inicio || !ev.fin) return;
  if (ev.inicio < start || ev.fin > endWindow) {
    throw new Error(
      `El evento “${ev.nombre}” (${ev.inicio.toLocaleString()}–${ev.fin.toLocaleString()}) ` +
      `sale de la ventana permitida (${start.toLocaleString()}–${endWindow.toLocaleString()}).`
    );
  }
}

/**
 * Verifica si la configuración cabe dentro de la ventana.
 * Muestra advertencia o info con desglose de tiempos.
 * Devuelve true si cabe, false si no.
 */
function verificarConfiguracion(
  equipos: Equipo[],
  config: any,
  start: Date,
  endWindow: Date,
  isLastDay: boolean
): boolean {
  const totalEquipos = equipos.length;
  const personal     = (config["Nº de personal para el registro"] as number) || 1;

  // Duraciones constantes
  const DUR_REG      = 5;
  const DUR_PAUSA    = 20;
  const DUR_INAU     = 20;
  const DUR_CARRERA  = 10;
  const NUM_CLAS     = (config["Nº de equipos que se clasifican"] as number) || 0;

  // Conteos por categoría
  const numEntry = equipos.filter(e => e.categoria === 'Entry').length;
  const numDev   = equipos.filter(e => e.categoria === 'Development').length;
  const numProf  = equipos.filter(e => e.categoria === 'Professional').length;

  // Nº de carreras clasificatorias por equipo (misma para todas las categorías)
  const roundsAll   = (config["Nº de carreras de clasificatoria por equipo"] as number) || 0;
  const roundsEntry = roundsAll;
  const roundsDev   = roundsAll;
  const roundsProf  = roundsAll;

  // 1) Registro: slots secuenciales con ‘personal’ personas
  const slotsRegistro  = Math.ceil(totalEquipos / personal);
  const tiempoRegistro = slotsRegistro * DUR_REG;

  // 2) Pausa / Charla
  const tiempoPausa    = DUR_PAUSA;

  // 3) Inauguración (solo si no se había programado antes)
  const tiempoInau     = inauguracionScheduled ? 0 : DUR_INAU;

  // 4) Evaluaciones: pipeline paralelo (mismo tiempo para todas)
  const dEscr          = numProf > 0 ? 25 : 20;
  const dPres          = 20;
  const dTec           = 15;
  const dEmp           = 10;
  const tiempoEval     = dEscr + dPres + dTec + dEmp;

  // 5) Pit Display: el peor caso (durPit máximo)
  const durPitMax      = Math.max(
    numEntry > 0 ? 60 : 0,
    numDev   > 0 ? 65 : 0,
    numProf  > 0 ? 65 : 0
  );
  const tiempoPit      = durPitMax;

  // 6) Carreras clasificatorias
  const carrerasEntry  = Math.ceil(numEntry / 2) * roundsEntry;
  const carrerasDev    = Math.ceil(numDev   / 2) * roundsDev;
  const carrerasProf   = Math.ceil(numProf  / 2) * roundsProf;
  const tiempoCarreras = (carrerasEntry + carrerasDev + carrerasProf) * DUR_CARRERA;

  // 7) Reserva de Eliminatorias
  const totalElims     = NUM_CLAS > 1 ? NUM_CLAS - 1 : 0;
  const tiempoReserva  = totalElims * DUR_CARRERA;

  // 8) Clausura (solo último día)
  const tiempoClausura = isLastDay ? 90 : 0;

  // Suma total y ventana disponible
  const tiempoTotalMin = tiempoRegistro + tiempoPausa + tiempoInau
                       + tiempoEval + tiempoPit + tiempoCarreras
                       + tiempoReserva + tiempoClausura;
  const ventanaMin     = (endWindow.getTime() - start.getTime()) / 60000;

  if (tiempoTotalMin > ventanaMin) {
    console.warn(
      `⚠️ Configuración NO cabe en la ventana (${ventanaMin}′): ` +
      `se necesitan ${tiempoTotalMin}′. ` +
      `Desglose: Registro ${tiempoRegistro}′, Pausa ${tiempoPausa}′, ` +
      `${tiempoInau}′ Inauguración, ${tiempoEval}′ Evaluaciones, ` +
      `${tiempoPit}′ Pit Display, ${tiempoCarreras}′ Carreras, ` +
      `${tiempoReserva}′ Reserva, ${tiempoClausura}′ Clausura.`
    );
    return false;
  } else {
    console.info(
      `✅ Configuración OK: requiere ${tiempoTotalMin}′ de los ${ventanaMin}′ disponibles.`
    );
    return true;
  }
}

/**
 * Asigna bloques a un lote de equipos en el rango [start, endWindow].
 * Devuelve la hora de inicio de las evaluaciones (para uso de jueces).
 */
export function asignarHorarios(
  equipos: Equipo[],
  config: any,
  start: Date,
  endWindow: Date,
  isLastDay = false
): Date {
  // Normalizar segundos y milisegundos para evitar offsets
  start.setSeconds(0, 0);
  endWindow.setSeconds(0, 0);

  console.log(
    '[asignarHorarios] start=', start.toLocaleTimeString(),
    'end=', endWindow.toLocaleTimeString(),
    'equipos=', equipos.map(e => e.nombre).join(','),
    'isLastDay=', isLastDay
  );

  // 0) Verificar configuración antes de empezar
  const configOK = verificarConfiguracion(equipos, config, start, endWindow, isLastDay);
  if (!configOK) {
    throw new Error('La configuración no cabe en la ventana. Ajusta los parámetros o la ventana.');
  }

  // Duraciones constantes
  const DUR_REG     = 5;
  const DUR_PAUSA   = 20;
  const DUR_INAU    = 20;
  const DUR_CARRERA = 10;

  // 1) Registro (siempre al inicio)
  const personal = (config["Nº de personal para el registro"] as number) || 1;
  equipos.forEach((eq, i) => {
    const slot = Math.floor(i / personal);
    const ini  = new Date(start.getTime() + slot * DUR_REG * 60000);
    const ev   = {
      nombre:   'Registro',
      duracion: DUR_REG,
      inicio:   ini,
      fin:      new Date(ini.getTime() + DUR_REG * 60000)
    };
    assertWithinWindow(ev, start, endWindow);
    eq.horario.push(ev);
    console.log(`  [Registro] ${eq.nombre}: ${ev.inicio.toLocaleTimeString()}–${ev.fin!.toLocaleTimeString()}`);
  });
  const finReg = new Date(Math.max(
    ...equipos.map(e => e.horario.find(ev => ev.nombre === 'Registro')!.fin!.getTime())
  ));
  console.log('Fin Registro (global):', finReg.toLocaleTimeString());

  // 2) Pausa / Charla post-registro
  const iniChar = finReg;
  const finChar = new Date(iniChar.getTime() + DUR_PAUSA * 60000);
  const charla  = {
    nombre:   'Charla/Presentación',
    duracion: DUR_PAUSA,
    inicio:   iniChar,
    fin:      finChar
  };
  assertWithinWindow(charla, start, endWindow);
  equipos.forEach(e => e.horario.push(charla));
  console.log(`Charla/Presentación: ${charla.inicio.toLocaleTimeString()}–${charla.fin.toLocaleTimeString()}`);

  // 3) Ceremonia de Inauguración (sólo la primera vez)
  let afterInaug: Date;
  if (!inauguracionScheduled) {
    const iniInau = finChar;
    const finInau = new Date(iniInau.getTime() + DUR_INAU * 60000);
    const inauEvt = {
      nombre:   'Ceremonia de Inauguración',
      duracion: DUR_INAU,
      inicio:   iniInau,
      fin:      finInau
    };
    assertWithinWindow(inauEvt, start, endWindow);
    equipos.forEach(e => e.horario.push(inauEvt));
    console.log(`Ceremonia de Inauguración: ${inauEvt.inicio.toLocaleTimeString()}–${inauEvt.fin.toLocaleTimeString()}`);
    inauguracionScheduled = true;
    afterInaug = finInau;
  } else {
    console.log('Ceremonia de Inauguración ya programada, se salta.');
    afterInaug = finChar;
  }

  // 4) Montaje del Pit Display (todos los días, justo tras la inauguración/charla)
  const numEntry = equipos.filter(e => e.categoria === 'Entry').length;
  const numDev   = equipos.filter(e => e.categoria === 'Development').length;
  const numProf  = equipos.filter(e => e.categoria === 'Professional').length;
  const durPitMax = Math.max(
    numEntry > 0 ? 60 : 0,
    numDev   > 0 ? 65 : 0,
    numProf  > 0 ? 65 : 0
  );
  const iniPitAll = new Date(afterInaug.getTime());
  equipos.forEach(eq => {
    const durPit = eq.categoria === 'Entry' ? 60 : 65;
    const evPit  = {
      nombre:   'Montaje del Pit Display',
      duracion: durPit,
      inicio:   iniPitAll,
      fin:      new Date(iniPitAll.getTime() + durPit * 60000)
    };
    assertWithinWindow(evPit, start, endWindow);
    eq.horario.push(evPit);
    console.log(`Pit Display ${eq.nombre}: ${evPit.inicio.toLocaleTimeString()}–${evPit.fin.toLocaleTimeString()}`);
  });
  const finPitAll = new Date(iniPitAll.getTime() + durPitMax * 60000);

  // 5) Evaluaciones individuales (a partir de finPitAll)
  const globalEvalStart = finPitAll;
  equipos.forEach(eq => {
    console.group(`Evaluaciones ${eq.nombre} (${eq.categoria})`);
    let cursor = new Date(globalEvalStart.getTime());
    const dEscr = eq.categoria === 'Professional' ? 25 : 20;
    const dPres = eq.categoria === 'Entry'        ? 10 : 20;
    const dTec  = eq.categoria === 'Entry'        ? 10 : 15;
    const dEmp  = eq.categoria === 'Entry'        ? 15 : 10;

    for (const [nombre, dur] of [
      ['Escrutinio',           dEscr],
      ['Presentación verbal',  dPres],
      ['Portfolio Técnico',    dTec],
      ['Portfolio de Empresa', dEmp],
    ] as [string, number][]) {
      const ini = new Date(cursor);
      const ev  = {
        nombre,
        duracion: dur,
        inicio:   ini,
        fin:      new Date(ini.getTime() + dur * 60000)
      };
      assertWithinWindow(ev, start, endWindow);
      eq.horario.push(ev);
      cursor = ev.fin!;
      console.log(`  ${nombre}: ${ev.inicio.toLocaleTimeString()}–${ev.fin!.toLocaleTimeString()} (dur ${dur}′)`);
    }
    (eq as any).individualEnd = cursor;
    console.log(`  Fin evaluaciones: ${cursor.toLocaleTimeString()}`);
    console.groupEnd();
  });

  // 6) Carreras clasificatorias (10' cada una)
  let cursor = new Date(Math.max(
    ...equipos.map(e => (e as any).individualEnd.getTime())
  ));
  console.log('Inicio Carreras en:', cursor.toLocaleTimeString());
  let counter = 1;
  outer: for (const cat of ['Entry','Development','Professional'] as const) {
    const lista = equipos.filter(e => e.categoria === cat);
    const nRnd  = (config["Nº de carreras de clasificatoria por equipo"] as number) || 0;
    console.log(`Carreras categoría ${cat}: rondas=${nRnd}, equipos=${lista.map(e=>e.nombre).join(',')}`);
    for (let r = 1; r <= nRnd; r++) {
      for (let i = 0; i < lista.length; i += 2) {
        const ini = new Date(cursor);
        const fin = new Date(ini.getTime() + DUR_CARRERA * 60000);
        if (fin > endWindow) {
          console.warn(`  Deteniendo carreras: próxima terminaría a ${fin.toLocaleTimeString()} fuera de ventana.`);
          break outer;
        }
        const nom = i+1 < lista.length
          ? `Carrera Clasificatoria ${counter}`
          : `Carrera Clasificatoria ${counter} (bye)`;
        const ev = { nombre: nom, duracion: DUR_CARRERA, inicio: ini, fin };
        lista[i].horario.push(ev);
        if (i+1 < lista.length) lista[i+1].horario.push(ev);
        console.log(`  [${cat}] ${nom}: ${ini.toLocaleTimeString()}–${fin.toLocaleTimeString()}`);
        counter++;
        cursor = fin;
      }
    }
  }

  // 7) Reserva de Eliminatorias
  const NUM_CLAS    = (config["Nº de equipos que se clasifican"] as number) || 0;
  const totalElims = NUM_CLAS > 1 ? NUM_CLAS - 1 : 0;
  const tiempoElim = totalElims * DUR_CARRERA;
  const iniR       = new Date(cursor);
  const finR       = new Date(iniR.getTime() + tiempoElim * 60000);
  const evR        = { nombre: 'Reserva Eliminatorias', duracion: tiempoElim, inicio: iniR, fin: finR };
  assertWithinWindow(evR, start, endWindow);
  equipos.forEach(e => e.horario.push(evR));
  console.log(`Reserva Eliminatorias: ${iniR.toLocaleTimeString()}–${finR.toLocaleTimeString()}`);

  // 8) Ceremonia de Clausura (90') solo al último día
  if (isLastDay) {
    const iniC = new Date(cursor);
    const evC  = {
      nombre:   'Ceremonia de Clausura',
      duracion: 90,
      inicio:   iniC,
      fin:      new Date(iniC.getTime() + 90 * 60000)
    };
    assertWithinWindow(evC, start, endWindow);
    equipos.forEach(e => e.horario.push(evC));
    console.log(`Ceremonia de Clausura: ${iniC.toLocaleTimeString()}–${evC.fin!.toLocaleTimeString()}`);
  }

  return globalEvalStart;
}

/**
 * Genera el horario para los jueces: un bloque idéntico por cada día.
 */
export function asignarHorariosJueces(
  equipos: Equipo[],
  config: any,
  globalEvalStarts: Date[]
): Juez[] {
  console.log('[asignarHorariosJueces] globalEvalStarts=', globalEvalStarts.map(d=>d.toLocaleTimeString()).join(','));
  const hasProf = equipos.some(e => e.categoria === 'Professional');
  const dEscr    = hasProf ? 25 : 20;
  const dPres    = 20;
  const dTec     = 15;
  const dEmp     = 10;

  const nVerbal = (config["Nº de Jueces para la presentación verbal"] as number) || 0;
  const nTec    = (config["Nº de Jueces para el portfolio técnico"]    as number) || 0;
  const nEmpJ   = (config["Nº de Jueces para el portfolio de empresa"] as number) || 0;

  const jueces: Juez[] = [];
  for (let i = 1; i <= nVerbal; i++)    jueces.push({ id: i, tipo: 'Presentación verbal',    horario: [] });
  for (let i = 1; i <= nTec;    i++)    jueces.push({ id: i, tipo: 'Portfolio Técnico',       horario: [] });
  for (let i = 1; i <= nEmpJ;   i++)    jueces.push({ id: i, tipo: 'Portfolio de Empresa',     horario: [] });

  globalEvalStarts.forEach((t0, day) => {
    console.log(`Jueces día ${day+1} arranque en ${t0.toLocaleTimeString()}`);
    const t1 = new Date(t0.getTime() + dEscr * 60000);
    const t2 = new Date(t1.getTime() + dPres * 60000);
    const t3 = new Date(t2.getTime() + dTec  * 60000);
    const t4 = new Date(t3.getTime() + dEmp  * 60000);

    for (let i = 0; i < nVerbal; i++) {
      jueces[i].horario.push({ nombre: 'Evaluación Presentación verbal', duracion: dPres, inicio: t1, fin: t2 });
    }
    for (let i = nVerbal; i < nVerbal + nTec; i++) {
      jueces[i].horario.push({ nombre: 'Evaluación Portfolio Técnico',    duracion: dTec, inicio: t2, fin: t3 });
    }
    for (let i = nVerbal + nTec; i < nVerbal + nTec + nEmpJ; i++) {
      jueces[i].horario.push({ nombre: 'Evaluación Portfolio de Empresa', duracion: dEmp, inicio: t3, fin: t4 });
    }
  });

  return jueces;
}
