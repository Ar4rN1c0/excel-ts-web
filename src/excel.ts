// src/excel.ts

/** Convierte fechas de Excel (número de serie) a Date de JS */
function excelDateToJSDate(serial: number): Date {
  return new Date((serial - 25569) * 86400 * 1000);
}

export function processInputData(configData: any[][], equiposData: any[][]) {
  const config: any = {};

  // 1) Leer pares clave/valor desde la hoja "Configuración"
  for (let i = 1; i < configData.length; i++) {
    const row = configData[i];
    if (!row || row.length < 2) continue;
    const key = String(row[0]).trim();
    let   v   = row[1];

    // Si vienen como serial de Excel y la clave es de tipo fecha
    if ((key.startsWith('Fecha de inicio') || key.startsWith('Día') ||
         key.startsWith('Inicio Día')   || key.startsWith('Fin Día')) &&
        typeof v === 'number') {
      v = excelDateToJSDate(v);
    } else if ((key.startsWith('Fecha de inicio') || key.startsWith('Día') ||
                key.startsWith('Inicio Día')   || key.startsWith('Fin Día')) &&
               !(v instanceof Date)) {
      v = new Date(v);
    }

    config[key] = v;
  }

  // 2) Valores por defecto para elementos que pueden no venir
  config["Nº de personal para el registro"]          ||= 1;
  config["Nº de Jueces para la presentación verbal"] ||= 0;
  config["Nº de Jueces para el portfolio técnico"]   ||= 0;
  config["Nº de Jueces para el portfolio de empresa"]||= 0;
  config["Tiempo Eliminatorias"]                    ||= 0;

  // 2.1) Duración de cada carrera y cálculo de “Reserva Eliminatorias”
  //     Se asume 10 min por carrera y que la clave "Nº de equipos que se clasifican"
  //     viene en la Configuración.
  config["Duración Carrera"] ||= 10;
  const clasifican = Number(config["Nº de equipos que se clasifican"] || 0);
  config["Tiempo Eliminatorias"] = clasifican * config["Duración Carrera"];

  // 3) Días puros
  config["Nº de Días"] ||= 1;
  const dias: Date[] = [];
  for (let d = 1; d <= config["Nº de Días"]; d++) {
    let v = config[`Día ${d}`];
    if (!(v instanceof Date)) v = new Date(v);
    dias.push(v);
  }
  config.dias = dias;

  // 4) Ventanas horarias
  const windows: { start: Date; end: Date }[] = [];
  for (let d = 1; d <= config["Nº de Días"]; d++) {
    let s = config[`Inicio Día ${d}`];
    let e = config[`Fin Día ${d}`];
    if (!(s instanceof Date)) s = new Date(s);
    if (!(e instanceof Date)) e = new Date(e);
    windows.push({ start: s, end: e });
  }
  config.windows = windows;

  // 5) Rounds por categoría (nº de carreras clasificatorias por equipo)
  //    (estas claves ya existían: Carreras Entry, Development, Professional)
  config.rounds = {
    Entry:        Number(config["Carreras Entry"]      || 0),
    Development:  Number(config["Carreras Development"]|| 0),
    Professional: Number(config["Carreras Professional"]|| 0),
  };

  // 6) Lectura de los equipos desde la hoja "Equipos"
  const equipos: any[] = [];
  for (let i = 1; i < equiposData.length; i++) {
    const row = equiposData[i];
    if (!row || row.length < 3) continue;
    equipos.push({
      id:        row[0],
      nombre:    row[1],
      categoria: row[2] as 'Entry'|'Development'|'Professional',
      horario:   [] as any[]
    });
  }

  return { config, equipos };
}
