import { Equipo, Juez } from "../../../types/types";

export function downloadStateAsJSON(teams: Equipo[], judges: Juez[]) {
    console.log("saving");
    const state = { teams, judges };
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "state.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 100);
}
