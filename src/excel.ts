// src/excel.ts
import * as XLSX from 'xlsx';

function excelDateToJSDate(serial: number): Date {
  return new Date((serial - 25569) * 86400 * 1000);
}

export interface Evento {
  nombre:   string;
  duracion: number;
  inicio:   Date;
  fin:      Date;
}

export interface Equipo {
  id:        number;
  nombre:    string;
  categoria: 'Entry' | 'Development' | 'Professional';
  horario:   Evento[];
}

export function processInputData(
  configData: any[][],
  equiposData: any[][]
): { config: Record<string, any>; equipos: Equipo[] } {
  const config: Record<string, any> = {};

  // 1) Leemos todas las claves de configuración
  for (let i = 1; i < configData.length; i++) {
    const [key, raw] = configData[i];
    if (!key) continue;
    let val = raw;
    if (key === 'Fecha de inicio') {
      val = raw instanceof Date
            ? new Date(raw)
            : typeof raw === 'number'
              ? excelDateToJSDate(raw)
              : new Date(raw);
      val.setSeconds(0, 0);
    }
    config[key] = val;
  }

  // 2) Valores por defecto
  config["Nº de personal para el registro"]           ||= 1;
  config["Nº de carreras clasificatorias"]            ||= 1;
  config["Tiempo Eliminatorias"]                      ||= 0;
  config["Nº de Jueces para el portfolio técnico"]    ||= 0;
  config["Nº de Jueces para el portfolio de empresa"] ||= 0;
  config["Nº de Jueces para la presentación verbal"]  ||= 0;
  config["Nº de equipos que se clasifican"]           ||= 0;

  // 3) Validación de número de equipos por categoría
  const expectedEntry       = config["Nº equipos de Entry"]       as number;
  const expectedDev         = config["Nº equipos de Development"] as number;
  const expectedProfessional= config["Nº equipos de Professional"]as number;
  // Contamos las filas de equipos (excluyendo encabezado)
  const filas = equiposData.slice(1).filter(r => r[0]!=null && r[1] && r[2]);
  const countByCat = filas.reduce<Record<string,number>>((acc, [id,nombre,categoria])=>{
    acc[categoria] = (acc[categoria]||0) + 1;
    return acc;
  }, {});
  if ((countByCat['Entry']||0)       !== expectedEntry
   ||(countByCat['Development']||0) !== expectedDev
   ||(countByCat['Professional']||0)!== expectedProfessional) {
    throw new Error(
      `El número de filas en "Equipos" (${JSON.stringify(countByCat)}) no coincide con `+
      `"Nº equipos de ..." en configuración (${expectedEntry}, ${expectedDev}, ${expectedProfessional}).`
    );
  }

  // 4) Construcción del array de equipos
  const equipos: Equipo[] = [];
  for (let i = 1; i < equiposData.length; i++) {
    const [id, nombre, categoria] = equiposData[i];
    if (id == null || !nombre || !categoria) continue;
    equipos.push({ id, nombre, categoria, horario: [] });
  }

  return { config, equipos };
}
