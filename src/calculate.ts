import { generateTeams } from "./helpers/generators/generateTeams";
import { calculateTime } from "./helpers/math/calculateTime";
import { GlobalConfig } from "./types/types"
import { generateInputView } from "./views/main/generateInputView"

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
    "Nº de carreras a la vez": 1,
    "Duración Carrera Development": 10,
    "Duración Carrera Entry": 10,
    "Duración Carrera Professional": 10,
    "Modalidad de Escrutinio": "Desestructurado",
    "Duración Escrutinio Fase 1": 10,
    "Duración Escrutinio Fase 2": 10,
    "Duración Escrutinio Fase 3": 10,
    "Duración Cómputo de Puntos": 90,
}

const showResult = (minsTaken: number) => {
    // Clear existing DOM content
    document.body.innerHTML = "";

    // Calculate hours and minutes
    const hours = Math.floor(minsTaken / 60);
    const minutes = minsTaken % 60;

    // Create the result elements
    const resultDiv = document.createElement("div");
    resultDiv.style.fontSize = "2rem";
    resultDiv.style.margin = "2em";

    resultDiv.innerHTML = `
        <h1>Tiempo mínimo necesario: ${hours} horas ${minutes} minutos</h1>
        <p style="color: red; font-weight: bold;">
            ⚠️ Este es el tiempo mínimo estrictamente necesario.<br>
            Algunas configuraciones de ventanas pueden requerir más tiempo real, porque algunos eventos no pueden partirse entre días
        </p>
    `;

    document.body.appendChild(resultDiv);
};



const calculate = async () => {
    const { config, teams: inputTeams } = await generateInputView();
    let teams = inputTeams;
    if (!inputTeams || !teams || inputTeams.length === 0) {
        const entryTeams = generateTeams("Entry", config["Nº equipos de Entry"]);
        const developmentTeams = generateTeams("Development", config["Nº equipos de Development"]);
        const professionalTeams = generateTeams("Professional", config["Nº equipos de Professional"]);

        teams = [...entryTeams, ...developmentTeams, ...professionalTeams];
    }


    const minsTaken = calculateTime(teams, config)
    showResult(minsTaken)
}

calculate()