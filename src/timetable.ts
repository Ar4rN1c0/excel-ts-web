// src/timetable.ts
import { Equipo, Evento } from './excel';

export interface Juez {
  id: number;
  tipo: 'Presentación verbal' | 'Portfolio Técnico' | 'Portfolio de Empresa';
  horario: Evento[];
}

export function asignarHorarios(
  equipos: Equipo[],
  config: Record<string, any>,
  fechaInicio: Date
): void {
  // --- VALIDACIONES ---
  const totalEquipos = equipos.length;
  const numClasifPorEquipo = config['Nº de carreras clasificatorias'] as number;
  if (numClasifPorEquipo * 2 > totalEquipos) {
    throw new Error(
      `No puede haber ${numClasifPorEquipo} carreras clasificatorias por equipo con solo ${totalEquipos} equipos.`
    );
  }
  const numClasificados = config['Nº de equipos que se clasifican'] as number;
  if (![8, 16, 32].includes(numClasificados)) {
    throw new Error(
      `El número de equipos que se clasifican (${numClasificados}) debe ser 8, 16 o 32.`
    );
  }
  if (numClasificados > totalEquipos) {
    throw new Error(
      `No se pueden clasificar ${numClasificados} equipos de un total de ${totalEquipos}.`
    );
  }

  // --- 1) Registro paralelo (5') SOLO Development & Professional ---
  const pReg = config['Nº de personal para el registro'] as number;
  const regTeams = equipos.filter(e => e.categoria !== 'Entry');
  regTeams.forEach((eq, idx) => {
    const slot = Math.floor(idx / pReg);
    const ini  = new Date(fechaInicio.getTime() + slot * 5 * 60000);
    ini.setSeconds(0, 0);
    const fin  = new Date(ini.getTime()  + 5 * 60000);
    fin.setSeconds(0, 0);
    eq.horario.push({ nombre: 'Registro', duracion: 5, inicio: ini, fin });
  });

  // --- 2) Charla/Presentación (20') tras último registro ---
  const ultimaFinReg = Math.max(
    ...regTeams.map(e => e.horario.find(x => x.nombre === 'Registro')!.fin.getTime())
  );
  const charlaIni = new Date(ultimaFinReg + 20 * 60000);
  charlaIni.setSeconds(0, 0);
  const charlaFin = new Date(charlaIni.getTime() + 20 * 60000);
  charlaFin.setSeconds(0, 0);
  equipos.forEach(e =>
    e.horario.push({
      nombre: 'Charla/Presentación',
      duracion: 20,
      inicio: charlaIni,
      fin: charlaFin
    })
  );

  // --- 3) Ceremonia de Inauguración (20') ---
  const inaugIni = new Date(charlaFin);
  inaugIni.setSeconds(0, 0);
  const inaugFin = new Date(inaugIni.getTime() + 20 * 60000);
  inaugFin.setSeconds(0, 0);
  equipos.forEach(e =>
    e.horario.push({
      nombre: 'Ceremonia de Inauguración',
      duracion: 20,
      inicio: inaugIni,
      fin: inaugFin
    })
  );

  // --- 4) Evaluaciones individuales secuenciales ---
  let globalEndEval = inaugFin.getTime();
  equipos.forEach(e => {
    let cur = new Date(inaugFin);
    const times: Record<string, number> = {
      'Escrutinio':           e.categoria === 'Professional' ? 25 : 20,
      'Presentación verbal':  e.categoria === 'Entry'        ? 10 : 20,
      'Portfolio Técnico':    e.categoria === 'Entry'        ? 10 : 15,
      'Portfolio de Empresa': 15
    };

    for (const nombre of Object.keys(times)) {
      const dur = times[nombre];
      const ini = new Date(cur);
      ini.setSeconds(0, 0);
      const fin = new Date(ini.getTime() + dur * 60000);
      fin.setSeconds(0, 0);
      e.horario.push({ nombre, duracion: dur, inicio: ini, fin });
      cur = fin;
    }
    globalEndEval = Math.max(globalEndEval, cur.getTime());
  });

  // --- 5) Montaje del Pit Display (65') – todos los equipos juntos ---
  const pitIni = new Date(globalEndEval);
  pitIni.setSeconds(0, 0);
  const pitFin = new Date(pitIni.getTime() + 65 * 60000);
  pitFin.setSeconds(0, 0);
  equipos.forEach(e =>
    e.horario.push({
      nombre: 'Montaje del Pit Display',
      duracion: 65,
      inicio: pitIni,
      fin: pitFin
    })
  );

  // --- 6) Clasificatorias globales (aleatorias) ---
  let raceTime = pitFin.getTime();
  let ctr = 1;
  const pool = [...equipos];
  for (let r = 0; r < numClasifPorEquipo; r++) {
    shuffle(pool);
    for (let i = 0; i < pool.length; i += 2) {
      const A = pool[i];
      const B = pool[i + 1] || null;
      const ini = new Date(raceTime);
      ini.setSeconds(0, 0);
      const fin = new Date(ini.getTime() + 10 * 60000);
      fin.setSeconds(0, 0);
      const nombre = B
        ? `Carrera Clasificatoria ${ctr}`
        : `Carrera Clasificatoria ${ctr} (bye)`;
      const carrera: Evento = { nombre, duracion: 10, inicio: ini, fin };
      A.horario.push(carrera);
      if (B) B.horario.push(carrera);
      ctr++;
      raceTime = fin.getTime();
    }
  }

  // --- 7) Eliminatorias (octavos, cuartos, semis, final) ---
  const roundNamesMap: Record<number, string[]> = {
    8:  ['Cuartos de Final', 'Semifinal', 'Final'],
    16: ['Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Final'],
    32: ['Dieciseisavos de Final', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Final']
  };
  const roundNames = roundNamesMap[numClasificados];
  let equiposEnRonda = numClasificados;

  for (const roundName of roundNames) {
    const partidos = equiposEnRonda / 2;
    for (let m = 1; m <= partidos; m++) {
      const ini = new Date(raceTime);
      ini.setSeconds(0, 0);
      const fin = new Date(ini.getTime() + 10 * 60000);
      fin.setSeconds(0, 0);
      const nombre = `${roundName} ${m}`;
      const ev: Evento = { nombre, duracion: 10, inicio: ini, fin };
      // Reservamos la franja para todos los equipos por si clasifican
      equipos.forEach(e => e.horario.push(ev));
      raceTime = fin.getTime();
    }
    equiposEnRonda = partidos;
  }

  // --- 8) Ceremonia de Clausura (90') ---
  const clsIni = new Date(raceTime);
  clsIni.setSeconds(0, 0);
  const clsFin = new Date(clsIni.getTime() + 90 * 60000);
  clsFin.setSeconds(0, 0);
  equipos.forEach(e =>
    e.horario.push({
      nombre: 'Ceremonia de Clausura',
      duracion: 90,
      inicio: clsIni,
      fin: clsFin
    })
  );
}

// Función auxiliar para barajar un array in-place
function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function asignarHorariosJueces(
  equipos: Equipo[],
  config: Record<string, any>
): Juez[] {
  const jueces: Juez[] = [];
  const slots = {
    'Presentación verbal': equipos.flatMap(e =>
      e.horario.filter(ev => ev.nombre === 'Presentación verbal')
    ),
    'Portfolio Técnico': equipos.flatMap(e =>
      e.horario.filter(ev => ev.nombre === 'Portfolio Técnico')
    ),
    'Portfolio de Empresa': equipos.flatMap(e =>
      e.horario.filter(ev => ev.nombre === 'Portfolio de Empresa')
    )
  } as const;

  for (const tipo of Object.keys(slots) as Array<keyof typeof slots>) {
    const n = config[`Nº de Jueces para ${tipo.toLowerCase()}`] as number;
    for (let i = 1; i <= n; i++) {
      jueces.push({
        id: i,
        tipo,
        horario: slots[tipo].map(ev => ({
          nombre: `Evaluación de ${tipo}`,
          duracion: ev.duracion,
          inicio: ev.inicio,
          fin: ev.fin
        }))
      });
    }
  }
  return jueces;
}
