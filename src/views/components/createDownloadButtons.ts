import { Equipo, Juez } from "../../types/types";
import { generarExcelEquipo, generarExcelJuez, generarExcelMaster } from "../../helpers/fileType/excel/output";
import { createDownloadButton } from "./createDownloadButton";
import { generateZip } from "../../helpers/fileType/zip/zipUtil";
import { downloadStateAsJSON } from "../../helpers/fileType/json/downloadStateAsJSON";
import { generateScheduleTable } from "../main/viewMasterTable";

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


    const downloadToHTML = createDownloadButton(
        "Descargar Horario en HTML",
        () => {
            const horario: string = generateScheduleTable(teams)
            const blob = new Blob([horario], {
                type: "text/html"
            })

            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = "Horario Maestro.html"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        }
    )
    section.appendChild(downloadToHTML)

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
    const judgeTimetableteams = [...teams]
    judges.forEach(juez => {
        const judgeBtn = createDownloadButton(
            `Descargar Horario Juez ${juez.nombre} en Excel`,
            () => {
                generarExcelJuez(juez, judgeTimetableteams)
                    .then(() => console.log(`Excel para el juez ${juez.id} descargado correctamente.`))
                    .catch((error) => console.error(`Error al generar el Excel para el juez ${juez.id}:`, error));
            }
        );
        section.appendChild(judgeBtn);
    });

    // Save State as JSON button (special styling)
    const saveStateBtn = createDownloadButton(
        "Guardar Estado (JSON)",
        () => downloadStateAsJSON(teams, judges)
    );
    saveStateBtn.classList.add("special-download-btn");
    section.appendChild(saveStateBtn);

    // ZIP ALL button (special styling)
    const zipBtn = createDownloadButton(
        "Descargar Todos en ZIP",
        async () => {
            await generateZip(teams, judges)
        }
    );
    zipBtn.classList.add("special-download-btn");
    section.appendChild(zipBtn);

    return section;
}
