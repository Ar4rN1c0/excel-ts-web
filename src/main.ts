import { generateTeams } from "./helpers/generators/generateTeams";
import { generateJudges } from "./helpers/generators/generateJudges";
import "./style.css";
import { generateMainView } from "./views/generateMainView";
//import { singleDaySchedule } from "./helpers/schedulers/singleDaySchedule";
import { assignJudgeSchedule } from "./helpers/assigners/assignJudgeTimetable";
import { Evento, GlobalConfig } from "./types/types";
import { multipleDaySchedule } from "./helpers/schedulers/multipleDaySchedule";
import { getGlobalWindows } from "./helpers/math/windows";
import { generateInputView } from "./views/generateInputView";

document.body.innerHTML = "";

export const dummyConfig: GlobalConfig = {
  "Nº equipos de Entry": 10,
  "Nº equipos de Development": 10,
  "Nº equipos de Professional": 10,
  "Nº de equipos que se clasifican": 4,
  "Nº de Jueces para el portfolio técnico": 3,
  "Nº de Jueces para el portfolio de empresa": 3,
  "Nº de Jueces para el escrutinio": 3,
  "Nº de Jueces para la presentación verbal": 2,
  "Nº de personal para el registro": 2,
  "Carreras Entry": 2,
  "Carreras Development": 4,
  "Carreras Professional": 4,
  "NumberOfDays": 3,
  "Dia 1 Start": "2025-06-17T07:00:00.000Z",
  "Dia 1 End": "2025-06-17T12:00:00.000Z",
  "Dia 2 Start": "2025-06-18T07:00:00.000Z",
  "Dia 2 End": "2025-06-18T10:00:00.000Z",
  "Dia 3 Start": "2025-06-19T07:00:00.000Z",
  "Dia 3 End": "2025-06-19T17:00:00.000Z",
  "Duración registro": 5,
  "Duración Charla/Presentación": 30,
  "Duración Montaje del Pit Display": 60,
  "Duración Escrutinio Entry": 15,
  "Duración Escrutinio Development": 20,
  "Duración Escrutinio Professional": 25,
  "Duración Portfolio Técnico Entry": 10,
  "Duración Portfolio Técnico Development": 15,
  "Duración Portfolio Técnico Professional": 15,
  "Duración Portfolio Empresa Entry": 0,
  "Duración Portfolio Empresa Development": 15,
  "Duración Portfolio Empresa Professional": 15,
  "Duración Presentación Verbal Entry": 15,
  "Duración Presentación Verbal Development": 15,
  "Duración Presentación Verbal Professional": 15,
  "Duración Ceremonia de Clausura y Premios": 60,
  "Duración Carrera": 10,
  "Tiempo Eliminatorias": 40,
  "rounds": {
    "Entry": 2,
    "Development": 4,
    "Professional": 4
  }
}

async function main() {
  try {
    const { config }: { config: GlobalConfig } = await generateInputView();
    console.log({ ...config });

    const numOfDays = config.NumberOfDays;

    const fechaInicio = new Date(config["Dia 1 Start"]!);
    const fechaFin = new Date(config[`Dia ${numOfDays} End`]!);

    console.log(fechaInicio);
    console.log(fechaFin);

    const entryTeams = generateTeams("Entry", config["Nº equipos de Entry"]);
    const developmentTeams = generateTeams("Development", config["Nº equipos de Development"]);
    const professionalTeams = generateTeams("Professional", config["Nº equipos de Professional"]);

    const teams = [...entryTeams, ...developmentTeams, ...professionalTeams];

    const judgesPortfolioTecnico = generateJudges("Portfolio Técnico", config["Nº de Jueces para el portfolio técnico"]);
    const judgesPortfolioEmpresa = generateJudges("Portfolio de Empresa", config["Nº de Jueces para el portfolio de empresa"]);
    const judgesVerbal = generateJudges("Presentación verbal", config["Nº de Jueces para la presentación verbal"]);
    const judgesScrutiny = generateJudges("Escrutinio", config["Nº de Jueces para el escrutinio"]);

    const judges = [...judgesPortfolioTecnico, ...judgesPortfolioEmpresa, ...judgesVerbal, ...judgesScrutiny];

    const windows = getGlobalWindows(config)

    multipleDaySchedule(teams, windows, judgesVerbal, judgesScrutiny, judgesPortfolioEmpresa, judgesPortfolioTecnico, config["Nº de personal para el registro"], config);

    const eventos: Evento[] = teams.flatMap(team => team.horario);
    judges.forEach(judge => assignJudgeSchedule(judge, eventos));


    document.body.innerHTML = '';

    generateMainView(teams, judges);
  } catch (error) {
    console.error('Hubo un error al procesar el archivo:', error);
  }
}

main();