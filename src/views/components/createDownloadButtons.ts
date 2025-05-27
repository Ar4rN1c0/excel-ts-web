import { Equipo, Juez } from "../../types/types";
import { generarExcelEquipo, generarExcelJuez, generarExcelMaster } from "../../helpers/excel/output";
import { createDownloadButton } from "./createDownloadButton";


export function createDownloadButtons(teams: Equipo[], judges: Juez[]): HTMLElement {
    const section = document.createElement("section");
    section.className = "button-section";

    // Master button
    const masterBtn = createDownloadButton(
        "Descargar Horario en Excel",
        () => {
            generarExcelMaster(teams)
                .then(() => console.log("Excel descargado correctamente."))
                .catch((error) => console.error("Error al generar el Excel:", error));
        }
    );
    section.appendChild(masterBtn);

    // Team buttons
    teams.forEach(equipo => {
        const teamBtn = createDownloadButton(
            `Descargar Horario ${equipo.nombre} en Excel`,
            () => {
                generarExcelEquipo(equipo)
                    .then(() => console.log(`Excel para el equipo ${equipo.nombre} descargado correctamente.`))
                    .catch((error) => console.error(`Error al generar el Excel para el equipo ${equipo.nombre}:`, error));
            }
        );
        section.appendChild(teamBtn);
    });

    // Judge buttons
    judges.forEach(juez => {
        const judgeBtn = createDownloadButton(
            `Descargar Horario Juez ${juez.nombre} en Excel`,
            () => {
                generarExcelJuez(juez)
                    .then(() => console.log(`Excel para el juez ${juez.id} descargado correctamente.`))
                    .catch((error) => console.error(`Error al generar el Excel para el juez ${juez.id}:`, error));
            }
        );
        section.appendChild(judgeBtn);
    });

    return section;
}
