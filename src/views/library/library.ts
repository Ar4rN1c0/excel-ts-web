import "../../style.css"
import { getScheduleKeys } from "../../helpers/storage/getSheduleKeys";
import { getStateFromKey } from "../../helpers/storage/getStateFromKey";
import { createDownloadButtons } from "../components/createDownloadButtons";
import { selectScheduleKey } from "../components/getScheduleKey";
import { generateScheduleTable } from "../main/viewMasterTable";



const library = async () => {
    const keys = getScheduleKeys()
    const selected = await selectScheduleKey(keys)
    const { teams, judges } = getStateFromKey(selected)!
    const buttons = createDownloadButtons(teams, judges)
    const table = generateScheduleTable(teams)

    document.body.appendChild(buttons)
    document.body.insertAdjacentHTML("beforeend", table)
}

library()