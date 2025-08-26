import { Assignation, Equipo, Juez } from "../../types/types";
import { createDownloadButton } from "./createDownloadButton";
import { generateZip } from "../../helpers/fileType/zip/zipUtil";
import { downloadStateAsJSON } from "../../helpers/fileType/json/downloadStateAsJSON";
import { generateScheduleTable } from "../main/viewMasterTable";
import { generarExcelMaster } from "../../helpers/fileType/excel/files/masterExcel";
import { generarExcelEquipo } from "../../helpers/fileType/excel/files/teamsExcel";
import { generarExcelJuez } from "../../helpers/fileType/excel/files/judgeExcel";

export function createDownloadButtons(teams: Equipo[], judges: Juez[], assignations: Assignation[]): HTMLElement {
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

    // HTML download button
    const downloadToHTML = createDownloadButton(
        "Descargar Horario en HTML",
        () => {
            const horario: string = generateScheduleTable(teams);
            const blob = new Blob([horario], {
                type: "text/html"
            });

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "Horario Maestro.html";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    );
    section.appendChild(downloadToHTML);

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
    judges.forEach((juez) => {
        const judgeBtn = createDownloadButton(
            `Descargar Horario Juez ${juez.nombre} en Excel`,
            () => {
                generarExcelJuez(juez, assignations)
                    .then(() => console.log(`Excel para el juez ${juez.id} descargado correctamente.`))
                    .catch((error) => console.error(`Error al generar el Excel para el juez ${juez.id}:`, error));
            }
        );
        section.appendChild(judgeBtn);
    });

    // Save State as JSON button (special styling)
    const saveStateContainer = document.createElement("div");
    saveStateContainer.className = "button-with-explanation";

    const saveStateBtn = createDownloadButton(
        "Guardar Estado",
        () => downloadStateAsJSON(teams, judges)
    );
    saveStateBtn.classList.add("special-download-btn");

    const saveExplanation = document.createElement("p");
    saveExplanation.className = "button-explanation";
    saveExplanation.textContent = "Guarda esta configuración para acceder a ella desde la librería.";

    saveStateContainer.appendChild(saveStateBtn);
    saveStateContainer.appendChild(saveExplanation);
    section.appendChild(saveStateContainer);

    // ZIP ALL button (special styling)
    const zipContainer = document.createElement("div");
    zipContainer.className = "button-with-explanation";

    const zipBtn = createDownloadButton(
        "Descargar Todos en ZIP",
        async () => {
            await generateZip(teams, judges, assignations);
        }
    );
    zipBtn.classList.add("special-download-btn");

    const zipExplanation = document.createElement("p");
    zipExplanation.className = "button-explanation";
    zipExplanation.textContent = "Descárgate un ZIP con todos los Excel generados.";

    zipContainer.appendChild(zipBtn);
    zipContainer.appendChild(zipExplanation);
    section.appendChild(zipContainer);

    return section;
}
