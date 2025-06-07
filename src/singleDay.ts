import { generateTeams } from "./helpers/generators/generateTeams";
import { generateJudges } from "./helpers/generators/generateJudges";
import "./style.css";
import { generateMainView } from "./views/main/generateMainView";
//import { singleDaySchedule } from "./helpers/schedulers/singleDaySchedule";
import { assignJudgeSchedule } from "./helpers/assigners/assignJudgeTimetable";
import { GlobalConfig } from "./types/types";
import { singleDaySchedule } from "./helpers/schedulers/singleDaySchedule";
import { generateInputView } from "./views/main/generateInputView";

document.body.innerHTML = "";


async function singleDay() {
  try {
    const { config }: { config: GlobalConfig } = await generateInputView();
    console.log({ ...config });


    const entryTeams = generateTeams("Entry", config["Nº equipos de Entry"]);
    const developmentTeams = generateTeams("Development", config["Nº equipos de Development"]);
    const professionalTeams = generateTeams("Professional", config["Nº equipos de Professional"]);

    const teams = [...entryTeams, ...developmentTeams, ...professionalTeams];

    const judgesPortfolioTecnico = generateJudges("Portfolio Técnico", config["Nº de Jueces para el portfolio técnico"]);
    const judgesPortfolioEmpresa = generateJudges("Portfolio de Empresa", config["Nº de Jueces para el portfolio de empresa"]);
    const judgesVerbal = generateJudges("Presentación Verbal", config["Nº de Jueces para la presentación verbal"]);
    const judgesScrutiny = generateJudges("Escrutinio", config["Nº de Jueces para el escrutinio"]);

    const judges = [...judgesPortfolioTecnico, ...judgesPortfolioEmpresa, ...judgesVerbal, ...judgesScrutiny];
    const startDate = new Date(config["Dia 1 Start"]!)
    const endDate = new Date(config["Dia 1 End"]!)

    singleDaySchedule(teams, startDate, endDate, judgesVerbal, judgesScrutiny, judgesPortfolioEmpresa, judgesPortfolioTecnico, config["Nº de personal para el registro"], config);
    const events = teams.flatMap(ev => ev.horario)

    const assignations = assignJudgeSchedule(judges, events, teams)

    document.body.innerHTML = '';

    generateMainView(teams, judges, assignations);
  } catch (error) {
    console.error('Hubo un error al procesar el archivo:', error);
  }
}

singleDay();