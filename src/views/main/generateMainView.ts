import { Equipo, Juez } from "../../types/types";
import { createDownloadButtons } from "../components/createDownloadButtons";
import { saveStateComponent } from "../components/saveStateComponent";
import { generateScheduleTable } from "./viewMasterTable";

export function generateMainView(teams: Equipo[], judges: Juez[]) {

    const buttonSection = createDownloadButtons(teams, judges);
    document.body.appendChild(buttonSection);

    const scheduleHTML = generateScheduleTable(teams);
    saveStateComponent(teams, judges);
    document.body.insertAdjacentHTML("beforeend", scheduleHTML);
}
