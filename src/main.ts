import { generateTeams } from "./helpers/generators/generateTeams";
import { generateJudges } from "./helpers/generators/generateJudges";
import "./style.css";
import { generateMainView } from "./views/main/generateMainView";
import { assignJudgeSchedule } from "./helpers/assigners/assignJudgeTimetable";
import { multipleDaySchedule } from "./helpers/schedulers/multipleDaySchedule";
import { getGlobalWindows } from "./helpers/math/windows";
import { generateInputView } from "./views/main/generateInputView";
import { showErrorUI } from "./views/components/errorHandler";
import { getRoot } from "./lib/htmlTools";

const root = getRoot();
root.innerHTML = "";



async function main() {
  try {
    const { config, teams: inputTeams } = await generateInputView();
    console.log({ ...config });
    let teams = inputTeams;
    if (!inputTeams || !teams || inputTeams.length === 0) {
      const entryTeams = generateTeams("Entry", config["Nº equipos de Entry"]);
      const developmentTeams = generateTeams("Development", config["Nº equipos de Development"]);
      const professionalTeams = generateTeams("Professional", config["Nº equipos de Professional"]);

      teams = [...entryTeams, ...developmentTeams, ...professionalTeams];
    }

    const judgesPortfolioTecnico = generateJudges("Portfolio Técnico", config["Nº de Jueces para el portfolio técnico"]);
    const judgesPortfolioEmpresa = generateJudges("Portfolio de Empresa", config["Nº de Jueces para el portfolio de empresa"]);
    const judgesVerbal = generateJudges("Presentación Verbal", config["Nº de Jueces para la presentación verbal"]);
    const judgesScrutiny = generateJudges("Escrutinio", config["Nº de Jueces para el escrutinio"]);

    const judges = [...judgesPortfolioTecnico, ...judgesPortfolioEmpresa, ...judgesVerbal, ...judgesScrutiny];


    const windows = getGlobalWindows(config)
    multipleDaySchedule(teams, windows, judgesVerbal, judgesScrutiny, judgesPortfolioEmpresa, judgesPortfolioTecnico, config["Nº de personal para el registro"], config);
    const events = teams.flatMap(ev => ev.horario)
    console.log(events)
    const assignations = assignJudgeSchedule(judges, events, teams)

    root.innerHTML = '';

    generateMainView(teams, judges, assignations);
  } catch (error) {
    console.error('Hubo un error al procesar el archivo:', error);
    showErrorUI(error);
  }

}

main()