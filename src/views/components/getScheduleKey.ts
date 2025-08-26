import { parseStateFromJSON } from "../../helpers/fileType/json/parseStateFromJSON";
import { getRoot } from "../../lib/htmlTools";
import { State } from "../../types/types";

export function selectScheduleSource(
  keys: string[]
): Promise<{ type: "local"; key: string } | { type: "upload"; state: State }> {
  return new Promise((resolve) => {
    const root = getRoot();

    // Wrapper keeps the component centered, but stays in normal flow (no absolute/fixed).
    const wrapper = document.createElement("div");
    wrapper.className = "schedule-source-wrapper";

    // Main container (dialog-like card)
    const container = document.createElement("div");
    container.className = "schedule-source";
    container.setAttribute("role", "dialog");
    container.setAttribute("aria-labelledby", "schedule-source-title");

    // Title
    const title = document.createElement("h2");
    title.id = "schedule-source-title";
    title.className = "schedule-source__title";
    title.textContent = "Cargar horario";
    container.appendChild(title);

    // --- Local storage section ---
    const localSection = document.createElement("section");
    localSection.className = "schedule-source__section";

    const localLabel = document.createElement("label");
    localLabel.className = "schedule-source__label";
    localLabel.textContent = "Selecciona uno de tus horarios guardados:";

    const localRow = document.createElement("div");
    localRow.className = "schedule-source__row";

    const select = document.createElement("select");
    select.className = "schedule-source__select";
    select.ariaLabel = "Horarios guardados";

    for (const key of keys) {
      const option = document.createElement("option");
      const shortKey = key.replace(/^Schedule: /, "");
      option.value = key;
      option.textContent = shortKey;
      select.appendChild(option);
    }

    const selectBtn = document.createElement("button");
    selectBtn.type = "button";
    selectBtn.className = "schedule-source__btn schedule-source__btn--primary";
    selectBtn.textContent = "Cargar seleccionado";
    selectBtn.disabled = keys.length === 0;
    selectBtn.onclick = () => {
      cleanup();
      resolve({ type: "local", key: select.value });
    };

    localRow.appendChild(select);
    localRow.appendChild(selectBtn);

    const localHelper = document.createElement("p");
    localHelper.className = "schedule-source__helper";
    localHelper.textContent =
      keys.length > 0
        ? "Elige un horario guardado previamente."
        : "No se han encontrado horarios guardados.";

    localSection.appendChild(localLabel);
    localSection.appendChild(localRow);
    localSection.appendChild(localHelper);

    // --- Separator ---
    const sep = document.createElement("div");
    sep.className = "schedule-source__separator";
    sep.innerHTML = '<span aria-hidden="true">o</span>';

    // --- Upload section ---
    const uploadSection = document.createElement("section");
    uploadSection.className = "schedule-source__section";

    const uploadLabel = document.createElement("label");
    uploadLabel.className = "schedule-source__label";
    uploadLabel.textContent = "Sube tu archivo de horario (.json):";

    const uploadRow = document.createElement("div");
    uploadRow.className = "schedule-source__row";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json,application/json";
    fileInput.className = "schedule-source__file";
    fileInput.ariaLabel = "Archivo JSON de horario";

    const uploadBtn = document.createElement("button");
    uploadBtn.type = "button";
    uploadBtn.className = "schedule-source__btn";
    uploadBtn.textContent = "Cargar archivo subido";
    uploadBtn.onclick = () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) {
        window.alert("Selecciona primero un archivo.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = (event.target?.result as string) ?? "";
          const state = parseStateFromJSON(text);
          if (!state) throw new Error("Could not extract state from given file");
          cleanup();
          resolve({ type: "upload", state });
        } catch {
          window.alert("Formato de archivo no válido o archivo dañado.");
        }
      };
      reader.readAsText(file);
    };

    uploadRow.appendChild(fileInput);
    uploadRow.appendChild(uploadBtn);

    uploadSection.appendChild(uploadLabel);
    uploadSection.appendChild(uploadRow);

    // Assemble
    container.appendChild(localSection);
    container.appendChild(sep);
    container.appendChild(uploadSection);

    wrapper.appendChild(container);
    root.appendChild(wrapper);

    // Focus the first interactive element for accessibility
    (keys.length > 0 ? select : fileInput).focus();

    function cleanup() {
      if (wrapper.parentElement === root) {
        root.removeChild(wrapper);
      }
    }
  });
}
