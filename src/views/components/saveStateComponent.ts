import { saveStateToStorage } from "../../helpers/storage/saveStateToLocalStorage";
import { Equipo, Juez } from "../../types/types";

export const saveStateComponent = (teams: Equipo[], judges: Juez[]) => {
    const saveStateForm = document.createElement("form");
    const saveStateInput = document.createElement("input");
    const saveStateButton = document.createElement("button");

    saveStateInput.type = "text";
    saveStateInput.placeholder = "Enter config name";

    saveStateButton.innerText = "Save Config";
    saveStateButton.type = "submit";

    saveStateForm.onsubmit = (e) => {
        e.preventDefault(); // Prevent page reload

        const stateName = saveStateInput.value.trim();
        if (!stateName) {
            alert("Please enter a name for the config.");
            return;
        }

        const currentState = { teams, judges };
        saveStateToStorage(currentState, stateName);
    };

    saveStateForm.appendChild(saveStateInput);
    saveStateForm.appendChild(saveStateButton);
    document.body.appendChild(saveStateForm);
};
