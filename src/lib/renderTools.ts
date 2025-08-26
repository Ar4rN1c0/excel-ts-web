import { saveAllInputsToCookie } from "../helpers/storage/cookie";
import { Circuito, Descanso, InputsMap } from "../types/types";
import { el, labeledInput } from "./htmlTools";
import { linkStartEnd, makeErrorFor, setError } from "./validationTools";

export const renderDescansos = (descansosContainer: HTMLDivElement, descansoValidators: Array<() => boolean>, descansos: Descanso[], inputs: InputsMap, circuitos: Circuito[]) => {
    descansoValidators.length = 0;
    // remove old rows
    Array.from(descansosContainer.querySelectorAll(".descanso-row")).forEach((n) => n.remove());

    descansos.forEach((d, idx) => {
        const row = el("div", { className: "descanso-row row" });

        const nameInput = el("input", {
            type: "text",
            value: d.name,
            placeholder: "Nombre",
            required: true,
            id: `descanso-${idx}-name`,
            className: "w-10em",
        }) as HTMLInputElement;

        const startInput = el("input", {
            type: "datetime-local",
            value: d.start,
            placeholder: "Inicio",
            required: true,
            id: `descanso-${idx}-start`,
        }) as HTMLInputElement;

        const endInput = el("input", {
            type: "datetime-local",
            value: d.end,
            placeholder: "Fin",
            required: true,
            id: `descanso-${idx}-end`,
        }) as HTMLInputElement;

        // error containers (ensure in DOM)
        const nameErr = makeErrorFor(nameInput, "descanso-name");
        const startErr = makeErrorFor(startInput, "descanso-start");
        const endErr = makeErrorFor(endInput, "descanso-end");

        // state + cookie
        nameInput.oninput = () => {
            descansos[idx].name = nameInput.value;
            if (!nameInput.value.trim()) setError(nameInput, "El nombre es obligatorio.");
            else setError(nameInput);
            saveAllInputsToCookie(inputs, descansos, circuitos);
        };
        const validatePair = linkStartEnd(startInput, endInput, `Descanso «${d.name || "sin nombre"}»`, inputs, descansos, circuitos);

        // Remove
        const removeBtn = el("button", {
            type: "button",
            textContent: "Eliminar",
            "aria-label": "Eliminar descanso",
            className: "btn btn--remove",
        });
        removeBtn.onclick = () => {
            descansos.splice(idx, 1);
            renderDescansos(descansosContainer, descansoValidators, descansos, inputs, circuitos);
            saveAllInputsToCookie(inputs, descansos, circuitos);
        };

        row.append(nameInput, startInput, endInput, removeBtn, nameErr, startErr, endErr);
        descansosContainer.append(row);

        descansoValidators.push(() => {
            let ok = true;
            if (!nameInput.value.trim()) {
                setError(nameInput, "El nombre es obligatorio.");
                ok = false;
            }
            ok = validatePair() && ok;
            return ok;
        });
    });
};

export const renderCircuitos = (circuitosContainer: HTMLDivElement, descansos: Descanso[], inputs: InputsMap, circuitos: Circuito[]) => {
    Array.from(circuitosContainer.querySelectorAll(".circuito-row")).forEach((n) => n.remove());
    circuitos.forEach((c, idx) => {
        const row = el("div", { className: "circuito-row row" });

        const label = el("label", { htmlFor: `fase-${c.fase}`, textContent: `Duración Fase ${c.fase}: ` });

        const input = el("input", {
            type: "number",
            min: "1",
            step: "1",
            value: c.duracion === "" ? "" : String(c.duracion),
            required: true,
            id: `fase-${c.fase}`,
            className: "w-7em",
        }) as HTMLInputElement;

        const err = makeErrorFor(input, `fase-${c.fase}-err`);

        input.oninput = () => {
            const val = input.value === "" ? "" : Number(input.value);
            circuitos[idx].duracion = val === "" ? "" : val;
            if (val === "" || isNaN(val) || val < 1) {
                setError(input, "Introduce un entero positivo (min. 1).");
            } else {
                setError(input);
            }
            saveAllInputsToCookie(inputs, descansos, circuitos);
        };

        const removeBtn = el("button", {
            type: "button",
            textContent: "Eliminar",
            "aria-label": `Eliminar fase ${c.fase}`,
            className: "btn btn--remove",
        });
        removeBtn.onclick = () => {
            circuitos.splice(idx, 1);
            renderCircuitos(circuitosContainer, descansos, inputs, circuitos);
            saveAllInputsToCookie(inputs, descansos, circuitos);
        };

        row.append(label, input, removeBtn, err);
        circuitosContainer.append(row);
    });
};

export const updateCircuitosVisibility = (inputs: InputsMap, circuitosFs: HTMLFieldSetElement) => {
    const isEstructurado = (inputs["Modalidad de Escrutinio"] as HTMLSelectElement).value === "Estructurado";
    if (isEstructurado) circuitosFs.classList.remove("hidden");
    else circuitosFs.classList.add("hidden");
};


export const renderDays = (dayValidators: Array<() => boolean>, inputs: InputsMap, descansos: Descanso[], circuitos: Circuito[], daysContainer: HTMLDivElement, saved?: Record<string, string>, ) => {
    dayValidators.length = 0;
    daysContainer.innerHTML = "";
    const num = Number((inputs["NumberOfDays"] as HTMLInputElement).value);
    if (!num || num < 1) return;

    for (let i = 1; i <= num; i++) {
        const startKey = `Dia ${i} Start`;
        const endKey = `Dia ${i} End`;

        const { container: startC, input: startI } = labeledInput(`Dia ${i} Start`, startKey, "datetime-local") as unknown as {
            container: HTMLElement; input: HTMLInputElement;
        };
        const { container: endC, input: endI } = labeledInput(`Dia ${i} End`, endKey, "datetime-local") as unknown as {
            container: HTMLElement; input: HTMLInputElement;
        };

        startI.required = true;
        endI.required = true;

        startC.append(makeErrorFor(startI, `${startKey}-err`));
        endC.append(makeErrorFor(endI, `${endKey}-err`));

        if (saved && saved[startKey]) startI.value = saved[startKey];
        if (saved && saved[endKey]) endI.value = saved[endKey];

        const validatePair = linkStartEnd(startI, endI, `Día ${i}`, inputs, descansos, circuitos);

        inputs[startKey] = startI;
        inputs[endKey] = endI;

        dayValidators.push(() => {
            let ok = true;
            if (!startI.value) {
                setError(startI, "Obligatorio.");
                ok = false;
            }
            if (!endI.value) {
                setError(endI, "Obligatorio.");
                ok = false;
            }
            ok = validatePair() && ok;
            return ok;
        });

        // wrap each pair into a row for spacing
        const row = el("div", { className: "row" });
        row.append(startC, endC);
        daysContainer.append(row);
    }
};
