import { handleFileInputChange } from "../../helpers/fileType/excel/handleInputChange";
import { loadFromCookie, saveAllInputsToCookie } from "../../helpers/storage/cookie";
import { clearErrorSummary, installStaticFieldValidation, validateDiaEscrutinioWithinDays, validateForm } from "../../helpers/validation/formValidation";
import { el, getRoot, labeledInput } from "../../lib/htmlTools";
import { renderCircuitos, renderDays, renderDescansos, updateCircuitosVisibility } from "../../lib/renderTools";
import { createSection } from "../../lib/sectionTools";
import { makeErrorFor, markOptional } from "../../lib/validationTools";
import { Circuito, Descanso, Equipo, GlobalConfig, InputsMap, STATIC_FIELDS } from "../../types/types";

export async function createConfigForm(): Promise<{ config: GlobalConfig; teams?: Equipo[] }> {
    return new Promise((resolve) => {
        document.getElementById("configForm")?.remove();

        const cookieData = loadFromCookie() || {};

        const inputs: InputsMap = {};
        let descansos: Descanso[] = [];
        let circuitos: Circuito[] = [];
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
            if (cookieData[field]) input.value = cookieData[field];
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
        const { container: diaEscrutinioContainer, input: diaEscrutinioInput } =
            labeledInput("Dia de Escrutinio", "Dia de Escrutinio", "date", false) as unknown as {
                container: HTMLElement;
                input: HTMLInputElement;
            };
        markOptional(diaEscrutinioContainer, diaEscrutinioInput);
        if (cookieData["Dia de Escrutinio"]) diaEscrutinioInput.value = cookieData["Dia de Escrutinio"];
        inputs["Dia de Escrutinio"] = diaEscrutinioInput;
        form.append(diaEscrutinioContainer);

        // Modalidad
        const modalidadDiv = el("div", { className: "section" });
        const modalidadSelect = el("select", { id: "Modalidad de Escrutinio", name: "Modalidad de Escrutinio" }) as HTMLSelectElement;
        ["Estructurado", "Desestructurado"].forEach((v) => modalidadSelect.append(el("option", { value: v, textContent: v })));
        modalidadSelect.required = true;
        if (cookieData["Modalidad de Escrutinio"]) modalidadSelect.value = cookieData["Modalidad de Escrutinio"];
        const modalidadLabel = el("label", { htmlFor: "Modalidad de Escrutinio", textContent: "Modalidad de Escrutinio: " }) as HTMLLabelElement;
        const modalidadErr = makeErrorFor(modalidadSelect, "modalidad");
        modalidadDiv.append(modalidadLabel, modalidadSelect, modalidadErr);
        inputs["Modalidad de Escrutinio"] = modalidadSelect;
        form.append(modalidadDiv);

        // Circuitos
        const { fieldset: circuitosFs, container: circuitosContainer, addButton: addCircuitoBtn } = createSection({
            legendText: "Fases de escrutinio (solo si Estructurado)",
            containerClass: "stack",
            addButton: { text: "+ Añadir fase de escrutinio", ariaLabel: "Añadir fase", className: "btn btn--add" },
        });
        const circuitosHint = el("div", {
            textContent: "Indica la duración de cada fase en minutos (número positivo).",
            className: "hint",
        });
        circuitosFs.insertBefore(circuitosHint, circuitosContainer);
        form.append(circuitosFs);

        // Equipos (Excel)
        const equiposFileDiv = el("div", { className: "section row" });
        const equiposFileInput = el("input", { type: "file", accept: ".xlsx, .xls", id: "equiposFile", name: "equiposFile" }) as HTMLInputElement;
        const equiposFileLabel = el("label", { htmlFor: "equiposFile", textContent: "Cargar archivo de equipos (Excel)" }) as HTMLLabelElement;
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

        // Restore Descansos / Circuitos from cookie
        const cookieDataKeys = Object.keys(cookieData);
        const descansoNames = cookieDataKeys
            .filter((k) => k.startsWith("Descanso ") && k.endsWith(" Start"))
            .map((k) => k.slice(9, -6).trim());

        descansos = descansoNames.map((name) => ({
            name,
            start: cookieData[`Descanso ${name} Start`] || "",
            end: cookieData[`Descanso ${name} End`] || "",
        }));

        const circuitoFases = cookieDataKeys
            .filter((k) => k.startsWith("Duración Escrutinio Fase "))
            .map((k) => Number(k.replace("Duración Escrutinio Fase ", "")))
            .filter((n) => !isNaN(n));

        circuitos = circuitoFases.map((fase) => ({
            fase,
            duracion:
                cookieData[`Duración Escrutinio Fase ${fase}`] !== undefined
                    ? Number(cookieData[`Duración Escrutinio Fase ${fase}`])
                    : "",
        }));

        // Rendering + validators holders
        const descansoValidators: Array<() => boolean> = [];
        const dayValidators: Array<() => boolean> = [];

        // Events
        Object.values(inputs).forEach((i) =>
            i.addEventListener("input", () => saveAllInputsToCookie(inputs, descansos, circuitos))
        );

        addDescansoBtn!.onclick = () => {
            descansos.push({ name: "", start: "", end: "" });
            renderDescansos(descansosContainer, descansoValidators, descansos, inputs, circuitos);
            saveAllInputsToCookie(inputs, descansos, circuitos);
        };

        addCircuitoBtn!.onclick = () => {
            const nextFase = circuitos.length ? Math.max(...circuitos.map((c) => c.fase)) + 1 : 1;
            circuitos.push({ fase: nextFase, duracion: "" });
            renderCircuitos(circuitosContainer, descansos, inputs, circuitos);
            saveAllInputsToCookie(inputs, descansos, circuitos);
        };

        (inputs["Modalidad de Escrutinio"] as HTMLSelectElement).addEventListener("change", () =>
            updateCircuitosVisibility(inputs, circuitosFs)
        );

        // When days are edited, re-render AND re-validate Día de Escrutinio live (so the inline error clears immediately)
        if (inputs["NumberOfDays"]) {
            (inputs["NumberOfDays"] as HTMLInputElement).required = true;
            inputs["NumberOfDays"].addEventListener("input", () => {
                renderDays(dayValidators, inputs, descansos, circuitos, daysContainer);
                validateDiaEscrutinioWithinDays({ inputs }); // ⬅️ live re-check
            });
            renderDays(dayValidators, inputs, descansos, circuitos, daysContainer, cookieData);
        }

        // Initial renders
        renderDescansos(descansosContainer, descansoValidators, descansos, inputs, circuitos);
        renderCircuitos(circuitosContainer, descansos, inputs, circuitos);
        updateCircuitosVisibility(inputs, circuitosFs);

        // ⬅️ NEW: Live validation for Día de Escrutinio itself
        diaEscrutinioInput.addEventListener("input", () => validateDiaEscrutinioWithinDays({ inputs }));
        diaEscrutinioInput.addEventListener("change", () => validateDiaEscrutinioWithinDays({ inputs }));
        // Run once on load (in case cookie had an out-of-range date)
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
                circuitos,
                circuitosContainer,
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
                for (const c of circuitos) {
                    if (c.fase && c.duracion !== "") {
                        config[`Duración Escrutinio Fase ${c.fase}`] = Number(c.duracion);
                    }
                }
            }

            form.remove();
            resolve({ config: config as GlobalConfig, teams });
        };
        const root = getRoot()
        root.append(form);
        form.scrollIntoView({ behavior: "smooth" });
    });
}
