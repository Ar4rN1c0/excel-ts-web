import { saveAllInputsToCookie } from "../helpers/storage/cookie";
import { Circuito, InputsMap, Descanso } from "../types/types";
import { el, syncDateOnly } from "./htmlTools";

export const fmtDateTime = (v: string) => (v ? new Date(v) : undefined);

// Make an ID safe for use in the DOM (no spaces or weird chars)
export const toSafeId = (raw: string) => raw.replace(/[^a-zA-Z0-9\-_:.]/g, "_");

export const makeErrorFor = (input: HTMLInputElement | HTMLSelectElement, idSuffix: string) => {
    const rawId = `${input.id || input.name || idSuffix}-error`;
    const id = toSafeId(rawId);

    const err = el("div", {
        id,
        role: "alert",
        "aria-live": "polite",
        className: "field-error",
    });

    // keep both the safe id and a direct reference handy
    (input as any).__errorId = id;
    (input as any).__errorEl = err;

    // wire aria-describedby (append to existing if present)
    const prev = (input.getAttribute("aria-describedby") || "").trim();
    input.setAttribute("aria-describedby", [prev, id].filter(Boolean).join(" "));

    return err;
};

export const setError = (input: HTMLInputElement | HTMLSelectElement, message?: string) => {
    // Prefer the stored element; otherwise look it up by attribute selector (no CSS escaping needed)
    let err = ((input as any).__errorEl as HTMLElement | null)
        || document.querySelector(`[id="${(input as any).__errorId}"]`) as HTMLElement | null;

    // fall back: ensure it exists inside the nearest container
    if (!err) {
        const container = (input.closest("label")?.parentElement || input.parentElement) as HTMLElement;
        err = makeErrorFor(input, "gen");
        container.append(err);
        (input as any).__errorEl = err;
    }

    if (message) {
        input.setAttribute("aria-invalid", "true");
        input.setCustomValidity(message);
        err.textContent = message;
    } else {
        input.removeAttribute("aria-invalid");
        input.setCustomValidity("");
        if (err) err.textContent = "";
    }
};
// UPDATED: accept the container and find its <label> safely
export const markOptional = (containerEl: HTMLElement, input: HTMLInputElement | HTMLSelectElement) => {
    const labelEl = containerEl.querySelector("label");
    if (labelEl) {
        const opt = el("span", { textContent: " (opcional)", className: "optional-tag" });
        labelEl.append(opt);
    }
    input.setAttribute("aria-required", "false");
};

export const linkStartEnd = (startI: HTMLInputElement, endI: HTMLInputElement, labelPrefix: string, inputs: InputsMap, descansos: Descanso[], circuitos: Circuito[]) => {
    const validate = () => {
        if (startI.value) endI.min = startI.value; else endI.removeAttribute("min");
        if (endI.value) startI.max = endI.value; else startI.removeAttribute("max");

        const s = fmtDateTime(startI.value);
        const e = fmtDateTime(endI.value);

        setError(startI);
        setError(endI);

        if (s && e && s.getTime() > e.getTime()) {
            setError(endI, `${labelPrefix}: la hora de fin debe ser posterior al inicio.`);
            return false;
        }
        if (!startI.required && !endI.required) {
            if ((startI.value && !endI.value) || (!startI.value && endI.value)) {
                setError(endI, `${labelPrefix}: si introduces una hora, completa ambos campos.`);
                return false;
            }
        }
        return true;
    };

    startI.addEventListener("input", () => {
        syncDateOnly(startI, endI);
        validate();
        saveAllInputsToCookie(inputs, descansos, circuitos);
    });
    endI.addEventListener("input", () => {
        validate();
        saveAllInputsToCookie(inputs, descansos, circuitos);
    });

    validate();
    return validate;
};