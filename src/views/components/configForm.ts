import { handleFileInputChange } from "../../helpers/fileType/excel/handleInputChange";
import { loadFromCookie, saveAllInputsToCookie } from "../../helpers/storage/cookie";
import {
  clearErrorSummary,
  installStaticFieldValidation,
  validateDiaEscrutinioWithinDays,
  validateForm,
} from "../../helpers/validation/formValidation";
import { el, getRoot, labeledInput } from "../../lib/htmlTools";
import { renderCircuitos, renderDays, renderDescansos, updateCircuitosVisibility } from "../../lib/renderTools";
import { createSection } from "../../lib/sectionTools";
import { makeErrorFor, markOptional } from "../../lib/validationTools";
import { Categoria, Circuito, Descanso, Equipo, GlobalConfig, InputsMap, STATIC_FIELDS } from "../../types/types";

const CATS: Categoria[] = ["Entry", "Development", "Professional"];
type CircuitosByCat = Record<Categoria, Circuito[]>;

export async function createConfigForm(): Promise<{ config: GlobalConfig; teams?: Equipo[] }> {
  return new Promise((resolve) => {
    document.getElementById("configForm")?.remove();

    const cookieData = loadFromCookie() || {};

    const inputs: InputsMap = {};
    let descansos: Descanso[] = [];
    // ⬇️ per-category circuitos
    let circuitosByCat: CircuitosByCat = { Entry: [], Development: [], Professional: [] };
    let teams: Equipo[] | undefined;

    const errorSummary = el("div", {
      id: "configForm-errors",
      role: "alert",
      "aria-live": "polite",
      tabIndex: -1,
      className: "errorSummary hidden",
    });

    const form = el("form", { id: "configForm", className: "form", "aria-describedby": "configForm-errors" });
    form.append(errorSummary);

    const generalesFs = el("fieldset", { className: "section" });
    const generalesLegend = el("legend", { textContent: "Datos generales" });
    generalesFs.append(generalesLegend);
    form.append(generalesFs);

    // Static fields
    for (const field of STATIC_FIELDS) {
      const { container, input } = labeledInput(field, field) as unknown as {
        container: HTMLElement;
        input: HTMLInputElement;
      };
      input.required = true;
      container.append(makeErrorFor(input, `${field}-err`));
      inputs[field] = input;
      if (cookieData[field] !== undefined) input.value = String(cookieData[field]); // 🔧 ensure string
      generalesFs.append(container);
    }
    installStaticFieldValidation(inputs);

    // Days container
    const { fieldset: daysFs, container: daysContainer } = createSection({
      id: "daysFs",
      legendText: "Días de competición",
      containerId: "daysContainer",
      containerClass: "stack",
    });
    form.append(daysFs);

    // Descansos
    const { fieldset: descansosFs, container: descansosContainer, addButton: addDescansoBtn } = createSection({
      id: "descansosFs",
      legendText: "Descansos (opcional)",
      containerId: "descansosContainer",
      containerClass: "stack",
      addButton: { text: "+ Añadir descanso", ariaLabel: "Añadir descanso", className: "btn btn--add" },
    });
    form.append(descansosFs);

    // Dia de escrutinio (opcional)
    const { container: diaEscrutinioContainer, input: diaEscrutinioInput } = labeledInput(
      "Dia de Escrutinio",
      "Dia de Escrutinio",
      "date",
      false
    ) as unknown as {
      container: HTMLElement;
      input: HTMLInputElement;
    };
    markOptional(diaEscrutinioContainer, diaEscrutinioInput);
    if (cookieData["Dia de Escrutinio"]) diaEscrutinioInput.value = String(cookieData["Dia de Escrutinio"]); // 🔧 ensure string
    inputs["Dia de Escrutinio"] = diaEscrutinioInput;
    form.append(diaEscrutinioContainer);

    // Modalidad
    const modalidadDiv = el("div", { className: "section" });
    const modalidadSelect = el("select", {
      id: "Modalidad de Escrutinio",
      name: "Modalidad de Escrutinio",
    }) as HTMLSelectElement;
    ["Estructurado", "Desestructurado"].forEach((v) => modalidadSelect.append(el("option", { value: v, textContent: v })));
    modalidadSelect.required = true;
    if (cookieData["Modalidad de Escrutinio"]) modalidadSelect.value = String(cookieData["Modalidad de Escrutinio"]); // 🔧 ensure string
    const modalidadLabel = el("label", { htmlFor: "Modalidad de Escrutinio", textContent: "Modalidad de Escrutinio: " }) as HTMLLabelElement;
    const modalidadErr = makeErrorFor(modalidadSelect, "modalidad");
    modalidadDiv.append(modalidadLabel, modalidadSelect, modalidadErr);
    inputs["Modalidad de Escrutinio"] = modalidadSelect;
    form.append(modalidadDiv);

    // =========================
    // Circuitos por CATEGORÍA
    // =========================
    const circuitosSections = new Map<
      Categoria,
      { fs: HTMLFieldSetElement; container: HTMLDivElement; addBtn: HTMLButtonElement }
    >();

    for (const cat of CATS) {
      const { fieldset: fs, container, addButton } = createSection({
        legendText: `Fases de escrutinio — ${cat} (solo si Estructurado)`,
        containerClass: "stack",
        addButton: { text: `+ Añadir fase ${cat}`, ariaLabel: `Añadir fase ${cat}`, className: "btn btn--add" },
      }) as unknown as { fieldset: HTMLFieldSetElement; container: HTMLDivElement; addButton?: HTMLButtonElement };
      const hint = el("div", {
        textContent: `Indica la duración (minutos) para cada fase de ${cat}.`,
        className: "hint",
      });
      fs.insertBefore(hint, container);
      form.append(fs);
      circuitosSections.set(cat, { fs, container, addBtn: addButton! });
    }

    // Equipos (Excel)
    const equiposFileDiv = el("div", { className: "section row" });
    const equiposFileInput = el("input", {
      type: "file",
      accept: ".xlsx, .xls",
      id: "equiposFile",
      name: "equiposFile",
    }) as HTMLInputElement;
    const equiposFileLabel = el("label", {
      htmlFor: "equiposFile",
      textContent: "Cargar archivo de equipos (Excel)",
    }) as HTMLLabelElement;
    markOptional(equiposFileDiv, equiposFileInput);
    equiposFileDiv.append(equiposFileLabel, equiposFileInput);
    form.append(equiposFileDiv);

    equiposFileInput.addEventListener("change", (event) => {
      handleFileInputChange(
        event,
        (processed) => {
          teams = processed.teams;
          alert(`Se cargaron ${teams.length} equipos.`);
        },
        (error) => {
          console.error(error);
          alert("Error al cargar los equipos desde el archivo Excel.");
        }
      );
    });

    const submitBtn = el("button", { type: "submit", textContent: "Guardar configuración", className: "btn btn--submit" });
    form.append(submitBtn);

    // Restore Descansos from cookie
    const cookieDataKeys = Object.keys(cookieData);
    const descansoNames = cookieDataKeys
      .filter((k) => k.startsWith("Descanso ") && k.endsWith(" Start"))
      .map((k) => k.slice(9, -6).trim());

    descansos = descansoNames.map((name) => ({
      name,
      start: cookieData[`Descanso ${name} Start`] || "",
      end: cookieData[`Descanso ${name} End`] || "",
    }));

    // Restore Circuitos (category-aware; supports legacy keys too)
    for (const cat of CATS) {
      const prefix = `Duración Escrutinio ${cat}Fase `;
      const faseNums = cookieDataKeys
        .filter((k) => k.startsWith(prefix))
        .map((k) => Number(k.replace(prefix, "")))
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b);

      const nFromCount = Number(cookieData[`Número de Fases ${cat}`] ?? 0);
      const n = Math.max(nFromCount || 0, faseNums.length || 0);

      const arr: Circuito[] = [];
      if (n > 0) {
        for (let i = 1; i <= n; i++) {
          const key = `${prefix}${i}`;
          const val = cookieData[key];
          arr.push({ fase: i, duracion: val !== undefined ? Number(val) : "" });
        }
      } else {
        // Legacy fallback: if there are global keys like "Duración Escrutinio Fase N", mirror them
        const legacyFases = cookieDataKeys
          .filter((k) => k.startsWith("Duración Escrutinio Fase "))
          .map((k) => Number(k.replace("Duración Escrutinio Fase ", "")))
          .filter((num) => !isNaN(num))
          .sort((a, b) => a - b);

        if (legacyFases.length) {
          for (const f of legacyFases) {
            const v = cookieData[`Duración Escrutinio Fase ${f}`];
            arr.push({ fase: f, duracion: v !== undefined ? Number(v) : "" });
          }
        }
      }

      circuitosByCat[cat] = arr;
    }

    // Rendering + validators holders
    const descansoValidators: Array<() => boolean> = [];
    const dayValidators: Array<() => boolean> = [];

    // Helper: flatten circuitos for legacy helpers expecting Circuito[]
    const flattenCircuitos = (): Circuito[] => [
      ...circuitosByCat.Entry,
      ...circuitosByCat.Development,
      ...circuitosByCat.Professional,
    ];

    // Cookie saver (category-aware)
    function saveAllInputsToCookieCategoryAware(
      inputsMap: InputsMap,
      descansosArr: Descanso[],
      byCat: CircuitosByCat
    ) {
      // Save base (without circuitos)
      saveAllInputsToCookie(inputsMap, descansosArr, []); // pass [] so legacy writer doesn't emit old keys

      const merged = { ...(loadFromCookie() || {}) };
      for (const cat of CATS) {
        const arr = byCat[cat] || [];
        if (arr.length) {
          merged[`Número de Fases ${cat}`] = String(arr.length);
          for (const c of arr) {
            if (c.fase && c.duracion !== "") {
              merged[`Duración Escrutinio ${cat}Fase ${c.fase}`] = String(c.duracion);
            }
          }
        } else {
          // optionally set to 0:
          // merged[`Número de Fases ${cat}`] = 0;
        }
      }
      document.cookie = `excel-config=${encodeURIComponent(JSON.stringify(merged))}; path=/; max-age=${60 * 60 * 24 * 365}`;
    }

    // Events
    Object.values(inputs).forEach((i) =>
      i.addEventListener("input", () => saveAllInputsToCookieCategoryAware(inputs, descansos, circuitosByCat))
    );

    addDescansoBtn!.onclick = () => {
      descansos.push({ name: "", start: "", end: "" });
      renderDescansos(
        descansosContainer as HTMLDivElement,
        descansoValidators,
        descansos,
        inputs,
        flattenCircuitos()
      );
      saveAllInputsToCookieCategoryAware(inputs, descansos, circuitosByCat);
    };

    // Render circuitos per category + add buttons
    for (const cat of CATS) {
      const { container, addBtn } = circuitosSections.get(cat)!;
      renderCircuitos(container as HTMLDivElement, descansos, inputs, circuitosByCat[cat]);
      addBtn.onclick = () => {
        const nextFase = circuitosByCat[cat].length ? Math.max(...circuitosByCat[cat].map((c) => c.fase)) + 1 : 1;
        circuitosByCat[cat].push({ fase: nextFase, duracion: "" });
        renderCircuitos(container as HTMLDivElement, descansos, inputs, circuitosByCat[cat]);
        saveAllInputsToCookieCategoryAware(inputs, descansos, circuitosByCat);
      };
    }

    // Toggle visibility per section with existing helper
    (inputs["Modalidad de Escrutinio"] as HTMLSelectElement).addEventListener("change", () => {
      for (const { fs } of circuitosSections.values()) updateCircuitosVisibility(inputs, fs as unknown as HTMLFieldSetElement);
    });

    // When days are edited, re-render AND re-validate Día de Escrutinio live
    if (inputs["NumberOfDays"]) {
      (inputs["NumberOfDays"] as HTMLInputElement).required = true;
      inputs["NumberOfDays"].addEventListener("input", () => {
        renderDays(
          dayValidators,
          inputs,
          descansos,
          flattenCircuitos(),
          daysContainer as HTMLDivElement,
          cookieData
        );
        validateDiaEscrutinioWithinDays({ inputs }); // live re-check
      });
      renderDays(
        dayValidators,
        inputs,
        descansos,
        flattenCircuitos(),
        daysContainer as HTMLDivElement,
        cookieData
      );
    }

    // Initial renders
    renderDescansos(
      descansosContainer as HTMLDivElement,
      descansoValidators,
      descansos,
      inputs,
      flattenCircuitos()
    );
    for (const { fs } of circuitosSections.values()) {
      updateCircuitosVisibility(inputs, fs as unknown as HTMLFieldSetElement);
      // already rendered above
    }

    // Live validation for Día de Escrutinio
    diaEscrutinioInput.addEventListener("input", () => validateDiaEscrutinioWithinDays({ inputs }));
    diaEscrutinioInput.addEventListener("change", () => validateDiaEscrutinioWithinDays({ inputs }));
    validateDiaEscrutinioWithinDays({ inputs });

    // Submit
    form.onsubmit = (ev) => {
      ev.preventDefault();

      clearErrorSummary(errorSummary);

      const ok = validateForm({
        inputs,
        dayValidators,
        descansoValidators,
        modalidadSelect: inputs["Modalidad de Escrutinio"] as HTMLSelectElement,
        circuitos: flattenCircuitos(), // ✅ legacy signature expects Circuito[]
        circuitosContainer: (Array.from(circuitosSections.values())[0]?.container as HTMLDivElement) ??
          (document.createElement("div") as HTMLDivElement),
        errorSummary: errorSummary as HTMLElement,
        descansos,
      });

      if (!ok) return;

      // Build config object
      const config: Record<string, any> = {};

      for (const field of STATIC_FIELDS) {
        config[field] = Number((inputs[field] as HTMLInputElement).value);
      }

      const numDays = Number((inputs["NumberOfDays"] as HTMLInputElement).value);
      for (let i = 1; i <= numDays; i++) {
        for (const part of ["Start", "End"] as const) {
          const key = `Dia ${i} ${part}`;
          config[key] = (inputs[key] as HTMLInputElement)?.value ?? "";
        }
      }

      for (const d of descansos) {
        if (d.name && d.start && d.end) {
          config[`Descanso ${d.name} Start`] = d.start;
          config[`Descanso ${d.name} End`] = d.end;
        }
      }

      config["Dia de Escrutinio"] = (inputs["Dia de Escrutinio"] as HTMLInputElement).value || undefined;
      config["Modalidad de Escrutinio"] = (inputs["Modalidad de Escrutinio"] as HTMLSelectElement).value;

      if (config["Modalidad de Escrutinio"] === "Estructurado") {
        // Emit per-category counts + durations
        for (const cat of CATS) {
          const arr = circuitosByCat[cat];
          if (arr?.length) {
            config[`Número de Fases ${cat}`] = arr.length;
            for (const c of arr) {
              if (c.fase && c.duracion !== "") {
                config[`Duración Escrutinio ${cat}Fase ${c.fase}`] = Number(c.duracion);
              }
            }
          } else {
            // optionally enforce explicit 0:
            // config[`Número de Fases ${cat}`] = 0;
          }
        }
      } else {
        // If Desestructurado, do not persist estructurado per-fase keys
      }

      form.remove();
      resolve({ config: config as GlobalConfig, teams });
    };

    const root = getRoot();
    root.append(form);
    form.scrollIntoView({ behavior: "smooth" });
  });
}
