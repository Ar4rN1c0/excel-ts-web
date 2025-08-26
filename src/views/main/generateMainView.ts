import { getRoot } from "../../lib/htmlTools";
import {  Assignation, Equipo, Juez } from "../../types/types";
import { createDownloadButtons } from "../components/createDownloadButtons";
import { saveStateComponent } from "../components/saveStateComponent";
import { generateScheduleTable } from "./viewMasterTable";

export function generateMainView(teams: Equipo[], judges: Juez[], assignations: Assignation[]) {
    const root = getRoot()
    const buttonSection = createDownloadButtons(teams, judges, assignations);
    root.appendChild(buttonSection);

    const scheduleHTML = generateScheduleTable(teams);
    saveStateComponent(teams, judges);
    root.insertAdjacentHTML("beforeend", scheduleHTML);
}
