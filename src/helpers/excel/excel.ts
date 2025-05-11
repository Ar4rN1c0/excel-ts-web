// src/excel.ts

export function processInputData(configData: any[][], equiposData: any[][]) {
  console.log('🚀 Entrando a processInputData');
  const config: any = {};

  // 1) Leer pares clave/valor desde la hoja "Configuración"
  for (let i = 1; i < configData.length; i++) {
    const row = configData[i];
    if (!row || row.length < 2) continue;
    const key = String(row[0]).trim();
    let v = row[1];


    // Manejo de fechas a partir de cadenas ISO
    if ((key === 'StartDate' || key === 'EndDate') && typeof v === 'string') {
      v = new Date(v); // Convertir la cadena ISO a objeto Date
      console.log(`   ↳ convertido a Date → ${v.getTime()}`);
    }

    config[key] = v;
  }

  // 2) Valores por defecto
  config["Nº de personal para el registro"] ||= 1;
  config["Nº de Jueces para la presentación verbal"] ||= 0;
  config["Nº de Jueces para el portfolio técnico"] ||= 0;
  config["Nº de Jueces para el portfolio de empresa"] ||= 0;
  config["Duración Carrera"] ||= 10;

  const clasifican = Number(config["Nº de equipos que se clasifican"] || 0);
  config["Tiempo Eliminatorias"] = clasifican * config["Duración Carrera"];
  console.log('⏱️ Tiempo Eliminatorias (min):', config["Tiempo Eliminatorias"]);

  // 3) Rounds por categoría
  config.rounds = {
    Entry: Number(config["Carreras Entry"] || 0),
    Development: Number(config["Carreras Development"] || 0),
    Professional: Number(config["Carreras Professional"] || 0),
  };
  console.log('🏁 Rounds:', config.rounds);

  // 4) Lectura de los equipos desde la hoja "Equipos"
  const equipos: any[] = [];
  for (let i = 1; i < equiposData.length; i++) {
    const row = equiposData[i];
    if (!row || row.length < 3) continue;
    equipos.push({
      id: row[0],
      nombre: row[1],
      categoria: row[2] as 'Entry' | 'Development' | 'Professional',
      horario: [] as any[]  // Aquí puedes agregar más lógica si es necesario
    });
  }

  return { config, equipos };
}
