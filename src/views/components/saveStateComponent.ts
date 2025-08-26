import { saveStateToStorage } from "../../helpers/storage/saveStateToLocalStorage";
import { getRoot } from "../../lib/htmlTools";
import { Equipo, Juez } from "../../types/types";

export const saveStateComponent = (teams: Equipo[], judges: Juez[]) => {
    const saveStateForm = document.createElement("form");
    const saveStateInput = document.createElement("input");
    const saveStateButton = document.createElement("button");
    const saveStateExplanation = document.createElement("p")

    saveStateInput.type = "text";
    saveStateInput.placeholder = "Introduce un nombre para esta configuración";
    saveStateInput.className = "save_state_input"
    saveStateButton.innerText = "Guardar Configuración";
    saveStateButton.type = "submit";
    saveStateButton.className = "save_state_button"

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

    saveStateExplanation.innerText = "Guarda la configuración para acceder a ella directamente desde la librería sin tener que descargar un archivo"

    saveStateForm.appendChild(saveStateInput);
    saveStateForm.appendChild(saveStateButton);
    saveStateForm.appendChild(saveStateExplanation);
    saveStateForm.className = "save_state_form"
    const root = getRoot()
    root.appendChild(saveStateForm);
};
