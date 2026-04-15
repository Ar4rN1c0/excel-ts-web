import { parseStateFromJSON } from "../../helpers/fileType/json/parseStateFromJSON";
import { removeFromStorage } from "../../helpers/storage/saveStateToLocalStorage";
import { getRoot } from "../../lib/htmlTools";
import { State } from "../../types/types";

export function selectScheduleSource(
  keys: string[]
): Promise<{ type: "local"; key: string } | { type: "upload"; state: State }> {
  return new Promise((resolve) => {
    const root = getRoot();
    const currentKeys = [...keys];

    const wrapper = document.createElement("div");
    wrapper.className = "schedule-source-wrapper";

    const container = document.createElement("div");
    container.className = "schedule-source";
    container.setAttribute("role", "dialog");
    container.setAttribute("aria-labelledby", "schedule-source-title");

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
    select.setAttribute("aria-label", "Horarios guardados");

    function repopulateOptions() {
      select.innerHTML = "";
      for (const key of currentKeys) {
        const option = document.createElement("option");
        const shortKey = key.replace(/^Schedule: /, "");
        option.value = key;
        option.textContent = shortKey;
        select.appendChild(option);
      }
    }
    repopulateOptions();

    const btns = document.createElement("div");
    btns.className = "schedule-source__btn-group";

    const selectBtn = document.createElement("button");
    selectBtn.type = "button";
    selectBtn.className = "schedule-source__btn schedule-source__btn--primary";
    selectBtn.textContent = "Cargar seleccionado";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "schedule-source__btn schedule-source__btn--danger";
    deleteBtn.textContent = "Eliminar seleccionado";

    const localHelper = document.createElement("p");
    localHelper.className = "schedule-source__helper";

    function updateLocalUI() {
      const hasItems = currentKeys.length > 0;
      select.disabled = !hasItems;
      selectBtn.disabled = !hasItems;
      deleteBtn.disabled = !hasItems;
      localHelper.textContent = hasItems
        ? "Elige un horario guardado previamente."
        : "No se han encontrado horarios guardados.";
    }
    updateLocalUI();

    selectBtn.onclick = () => {
      if (!select.value) return;
      cleanup();
      resolve({ type: "local", key: select.value });
    };

    deleteBtn.onclick = () => {
      const key = select.value;
      if (!key) return;

      const shortKey = key.replace(/^Schedule: /, "");
      const confirmed = window.confirm(
        `¿Seguro que quieres eliminar “${shortKey}”? Esta acción no se puede deshacer.`
      );
      if (!confirmed) return;

      // Remove from storage
      removeFromStorage(key);

      // Remove from UI
      const idx = currentKeys.indexOf(key);
      if (idx !== -1) currentKeys.splice(idx, 1);

      repopulateOptions();
      updateLocalUI();

      if (currentKeys.length > 0) {
        select.focus();
      } else {
        fileInput.focus();
      }
    };

    btns.appendChild(selectBtn);
    btns.appendChild(deleteBtn);
    deleteBtn.className = "delete__btn"

    localRow.appendChild(select);
    localRow.appendChild(btns);

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
    fileInput.setAttribute("aria-label", "Archivo JSON de horario");

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
          if (!state) throw new Error("No se pudo extraer un horario del archivo seleccionado");
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

    // Focus the first interactive element
    (currentKeys.length > 0 ? select : fileInput).focus();

    function cleanup() {
      if (wrapper.parentElement === root) {
        root.removeChild(wrapper);
      }
    }
  });
}
