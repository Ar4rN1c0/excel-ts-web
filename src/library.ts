import "./style.css"
import "./styles/library.css"
import { getScheduleKeys } from "./helpers/storage/getSheduleKeys";
import { getStateFromKey } from "./helpers/storage/getStateFromKey";
import { createDownloadButtons } from "./views/components/createDownloadButtons";
import { generateScheduleTable } from "./views/main/viewMasterTable";
import { selectScheduleSource } from "./views/components/getScheduleKey";
import { assignJudgeSchedule } from "./helpers/assigners/assignJudgeTimetable";
import { getRoot } from "./lib/htmlTools";


const library = async () => {
    const keys = getScheduleKeys();
    const choice = await selectScheduleSource(keys);
    let teams, judges;

    if (choice.type === "local") {
        ({ teams, judges } = getStateFromKey(choice.key)!);
    } else {
        ({ teams, judges } = choice.state);
    }
    const events = teams.flatMap(ev => ev.horario)
    for(const judge of judges) {
        judge.horario = []
    }
    const assignations = assignJudgeSchedule(judges, events, teams)
    const buttons = createDownloadButtons(teams, judges, assignations);
    const table = generateScheduleTable(teams);
    const root = getRoot()
    root.appendChild(buttons);
    root.insertAdjacentHTML("beforeend", table);
}


library();
