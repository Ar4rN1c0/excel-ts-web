import { Equipo, Juez } from "../../types/types";
import { generarExcelEquipo, generarExcelJuez, generarExcelMaster } from "../excel/output";
import { generateScheduleTable } from "./viewMasterTable";
//import { generateScheduleHTML } from "./masterSchedule";


export function generateMainView(teams: Equipo[], judges: Juez[]) {
    // Crear botón de descarga para el horario maestro
    const botonExcel = document.createElement("button");
    botonExcel.textContent = "Descargar Horario en Excel";
    botonExcel.style.margin = "20px";
    botonExcel.style.padding = "10px 20px";
    botonExcel.style.fontSize = "16px";
    botonExcel.style.display = "block"; // Para ocupar toda la línea
    botonExcel.style.marginBottom = "30px";

    // Evento para generar y descargar el Excel
    botonExcel.addEventListener("click", () => {
        generarExcelMaster(teams)
            .then(() => {
                console.log("Excel descargado correctamente.");
            })
            .catch((error) => {
                console.error("Error al generar el Excel:", error);
            });
    });

    const buttonSection = document.createElement("section");
    buttonSection.className = "button-section";

    // Insertar el horario general + botón de descarga para el horario maestro
    document.body.appendChild(botonExcel);
    
    // Crear botones de descarga para cada equipo
    teams.forEach((equipo) => {
        const botonEquipo = document.createElement("button");
        botonEquipo.textContent = `Descargar Horario ${equipo.nombre} en Excel`;
        botonEquipo.style.margin = "20px";
        botonEquipo.style.padding = "10px 20px";
        botonEquipo.style.fontSize = "16px";
        botonEquipo.style.display = "block"; // Para ocupar toda la línea
        botonEquipo.style.marginBottom = "30px";

        // Evento para generar y descargar el Excel para el equipo individual
        botonEquipo.addEventListener("click", () => {
            generarExcelEquipo(equipo)
                .then(() => {
                    console.log(`Excel para el equipo ${equipo.nombre} descargado correctamente.`);
                })
                .catch((error) => {
                    console.error(`Error al generar el Excel para el equipo ${equipo.nombre}:`, error);
                });
        });

        // Insertar el botón para cada equipo
        buttonSection.appendChild(botonEquipo);
    });

    // Crear botones de descarga para cada juez
    judges.forEach((juez) => {
        const botonJuez = document.createElement("button");
        botonJuez.textContent = `Descargar Horario Juez ${juez.id} (${juez.tipo}) en Excel`;
        botonJuez.style.margin = "20px";
        botonJuez.style.padding = "10px 20px";
        botonJuez.style.fontSize = "16px";
        botonJuez.style.display = "block"; // Para ocupar toda la línea
        botonJuez.style.marginBottom = "30px";

        // Evento para generar y descargar el Excel para el juez individual
        botonJuez.addEventListener("click", () => {
            generarExcelJuez(juez)
                .then(() => {
                    console.log(`Excel para el juez ${juez.id} descargado correctamente.`);
                })
                .catch((error) => {
                    console.error(`Error al generar el Excel para el juez ${juez.id}:`, error);
                });
        });

        // Insertar el botón para cada juez
        buttonSection.appendChild(botonJuez);
    });

    const scheduleHTML = generateScheduleTable(teams);
    document.body.appendChild(buttonSection);
    document.body.insertAdjacentHTML("beforeend", scheduleHTML);
}
