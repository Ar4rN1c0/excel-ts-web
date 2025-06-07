import "../../style.css"
import { getScheduleKeys } from "../../helpers/storage/getSheduleKeys";
import { getStateFromKey } from "../../helpers/storage/getStateFromKey";
import { createDownloadButtons } from "../components/createDownloadButtons";
import { generateScheduleTable } from "../main/viewMasterTable";
import { selectScheduleSource } from "../components/getScheduleKey";
import { assignJudgeSchedule } from "../../helpers/assigners/assignJudgeTimetable";


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

    const assignations = assignJudgeSchedule(judges, events, teams)
    const buttons = createDownloadButtons(teams, judges, assignations);
    const table = generateScheduleTable(teams);

    document.body.appendChild(buttons);
    document.body.insertAdjacentHTML("beforeend", table);
}


library();
