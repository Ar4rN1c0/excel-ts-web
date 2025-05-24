import { Equipo } from "../../types/types";
import { assignGlobalEvent } from "./assignGlobal";

export function assignDescansos(windows: Date[][], teams: Equipo[]) {
    for (let i = 0; i < windows.length - 1; i++) {
        const endCurrent = windows[i][1];
        const startNext = windows[i + 1][0];
        if (endCurrent < startNext) {
            assignGlobalEvent(
                "Descanso",
                endCurrent,
                (startNext.getTime() - endCurrent.getTime()) / 60000,
                teams
            );
        }
    }
}