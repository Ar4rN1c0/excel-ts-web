import { Categoria, Equipo, GlobalConfig } from "../../../types/types";

const CATEGORIAS: Categoria[] = ["Entry", "Development", "Professional"];

export function processExcelData(configData: any[][], equiposData: any[][]): { config: GlobalConfig, teams: Equipo[] } {
  // -------- Config --------
  const config: any = {};
  const diaFieldRegex = /^Dia (\d+) (Start|End)$/i;

  for (let i = 1; i < configData.length; i++) {
    const row = configData[i];
    if (!row || row.length < 2) continue;
    const key = String(row[0]).trim();
    let v = row[1];

    // Parse day fields as Date
    const diaMatch = key.match(diaFieldRegex);
    if (diaMatch && typeof v === 'string') {
      v = new Date(v);
      config[key] = v;
      continue;
    }
    if (typeof v === 'string' && !isNaN(Number(v))) {
      v = Number(v);
    }
    config[key] = v;
  }

  // Defaults (as before)
  config["Nº de personal para el registro"] ||= 1;
  config["Nº de Jueces para la presentación verbal"] ||= 0;
  config["Nº de Jueces para el portfolio técnico"] ||= 0;
  config["Nº de Jueces para el portfolio de empresa"] ||= 0;
  config["Duración Carrera"] ||= 10;

  const clasifican = Number(config["Nº de equipos que se clasifican"] || 0);
  config["Tiempo Eliminatorias"] = clasifican * config["Duración Carrera"];

  config.rounds = {
    Entry: Number(config["Carreras Entry"] || 0),
    Development: Number(config["Carreras Development"] || 0),
    Professional: Number(config["Carreras Professional"] || 0),
  };

  // -------- Equipos --------
  const teams: Equipo[] = [];
  // Assuming first row is header: ['ID', 'Nombre', 'Categoria']
  for (let i = 1; i < equiposData.length; i++) {
    const row = equiposData[i];
    if (!row || row.length < 3) continue;
    const id = Number(row[0]);
    const nombre = String(row[1]);
    const categoria = String(row[2]) as Categoria;
    if (!CATEGORIAS.includes(categoria)) continue; // skip invalid category

    teams.push({
      id,
      nombre,
      categoria,
      horario: [],
    });
  }

  return { config: config as GlobalConfig, teams };
}
