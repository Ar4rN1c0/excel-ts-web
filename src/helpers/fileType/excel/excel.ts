import { Categoria, Equipo, GlobalConfig } from "../../../types/types";

const CATEGORIAS: Categoria[] = ["Entry", "Development", "Professional"];

export function processExcelData(configData: any[][], equiposData: any[][]): { config: GlobalConfig, teams: Equipo[] } {
  const config: any = {};
  const diaFieldRegex = /^Dia \d+ (Start|End)$/i;
  const descansoFieldRegex = /^Descanso .+ (Start|End)$/i;
  const roundsFieldRegex = /^rounds\.(Entry|Development|Professional)$/i;

  for (let i = 1; i < configData.length; i++) {
    const row = configData[i];
    if (!row || row.length < 2) continue;

    const key = String(row[0]).trim();
    let value = row[1];

    // Parse dates
    if ((typeof value === "string") && (diaFieldRegex.test(key) || descansoFieldRegex.test(key))) {
      value = new Date(value);
    }

    // Parse numbers
    if (typeof value === "string" && !isNaN(Number(value))) {
      value = Number(value);
    }

    // Handle rounds fields
    const roundMatch = key.match(roundsFieldRegex);
    if (roundMatch) {
      const cat = roundMatch[1];
      if (!config.rounds) config.rounds = {};
      config.rounds[cat] = Number(value);
      continue;
    }

    // Normal config assignment
    config[key] = value;
  }

  // Default fallbacks
  config["Nº de personal para el registro"] ||= 1;
  config["Nº de Jueces para la presentación verbal"] ||= 0;
  config["Nº de Jueces para el portfolio técnico"] ||= 0;
  config["Nº de Jueces para el portfolio de empresa"] ||= 0;

  // Set Tiempo Eliminatorias if clasifican and carrera duration exist
  const clasifican = Number(config["Nº de equipos que se clasifican"] || 0);
  const durCarrera = config["Duración Carrera Entry"] || config["Duración Carrera"] || 10;
  config["Tiempo Eliminatorias"] ||= clasifican * durCarrera;

  // -------- Equipos --------
  const teams: Equipo[] = [];
  for (let i = 1; i < equiposData.length; i++) {
    const row = equiposData[i];
    if (!row || row.length < 3) continue;

    const id = Number(row[0]);
    const nombre = String(row[1]);
    const categoria = String(row[2]) as Categoria;

    if (!CATEGORIAS.includes(categoria)) continue;

    teams.push({
      id,
      nombre,
      categoria,
      horario: [],
    });
  }

  return {
    config: config as GlobalConfig,
    teams
  };
}
