// helpers/validation/configFormValidation.ts
import { setError } from "../../lib/validationTools";
import { Circuito, Descanso, InputsMap, STATIC_FIELDS } from "../../types/types";

/* ----------------------------- Robust parsing ----------------------------- */

/** Parse "YYYY-MM-DD" WITHOUT timezone/hours and return a YMD number (null if invalid). */
function parseDateOnlyToYMD(v: string): number | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return y * 10000 + mo * 100 + d;
}

/** Parse a datetime-local value "YYYY-MM-DDTHH:mm" (optionally with seconds) as a local Date. */
function parseDateTimeLocalString(v: string): Date | null {
    // Examples: "2025-10-10T09:00" or "2025-10-10T09:00:00"
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(v);
    if (!m) return null;
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    const hh = Number(m[4]), mm = Number(m[5]), ss = m[6] ? Number(m[6]) : 0;
    const dt = new Date(y, mo - 1, d, hh, mm, ss, 0);
    // quick validation
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    if (dt.getHours() !== hh || dt.getMinutes() !== mm || dt.getSeconds() !== ss) return null;
    return dt;
}

/**
 * Best-effort parse for possibly-locale strings like "10/10/2025, 09:00 AM".
 * Supports dd/mm/yyyy or mm/dd/yyyy if unambiguous, with optional AM/PM.
 */
function parseLocaleDateTimeString(v: string): Date | null {
    if (!v) return null;
    // normalize unicode spaces
    v = v.replace(/\u202F|\u00A0/g, " ").trim();
    // split date and time around comma or space
    const parts = v.split(",").map(s => s.trim());
    let datePart = parts[0] || "";
    let timePart = (parts[1] || "").trim();

    // Sometimes formats like "10/10/2025 09:00 AM"
    if (!timePart && /\d{1,2}:\d{2}/.test(datePart)) {
        const m = /(.*)\s+(\d{1,2}:\d{2}(?:\s*[AP]M)?)$/i.exec(datePart);
        if (m) {
            datePart = m[1].trim();
            timePart = m[2].trim();
        }
    }

    // Parse date dd/mm/yyyy or mm/dd/yyyy by checking which is plausible;
    // given the app context (Spain), prefer dd/mm/yyyy first.
    const dm = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(datePart);
    if (!dm) {
        // fall back to native parse (last resort)
        const nd = new Date(v);
        return isNaN(nd.getTime()) ? null : nd;
    }
    let d = Number(dm[1]);
    let m = Number(dm[2]);
    const y = Number(dm[3]);

    // If numbers > 12 decide order; prefer dd/mm/yyyy (EU)
    if (m > 12 && d <= 12) {
        // swap (was mm/dd/yyyy actually)
        const tmp = d; d = m; m = tmp;
    }
    // Validate date first
    const validDate = new Date(y, m - 1, d);
    if (validDate.getFullYear() !== y || validDate.getMonth() !== m - 1 || validDate.getDate() !== d) return null;

    // Parse time (default 00:00)
    let hh = 0, mmn = 0;
    if (timePart) {
        const tm = /^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i.exec(timePart);
        if (!tm) return null;
        hh = Number(tm[1]); mmn = Number(tm[2]);
        const ap = tm[3];
        if (ap) {
            const upper = ap.toUpperCase();
            if (upper === "AM") {
                if (hh === 12) hh = 0;
            } else if (upper === "PM") {
                if (hh !== 12) hh += 12;
            }
        }
        if (hh < 0 || hh > 23 || mmn < 0 || mmn > 59) return null;
    }

    return new Date(y, m - 1, d, hh, mmn, 0, 0);
}

/** Unified tolerant parser for inputs: tries datetime-local, then locale, then native. */
function parseFlexibleDateTime(input?: HTMLInputElement): Date | null {
    if (!input) return null;
    const raw = input.value?.trim();
    if (!raw) return null;

    // If it's a datetime-local input, parse strictly as local
    if (input.type === "datetime-local") {
        const dt = parseDateTimeLocalString(raw);
        if (dt) return dt;
    }

    // Try ISO-like first
    const isoTry = new Date(raw);
    if (!isNaN(isoTry.getTime())) return isoTry;

    // Try locale-ish
    const loc = parseLocaleDateTimeString(raw);
    if (loc) return loc;

    return null;
}

/** Simple ISO datetime parser for direct values (kept for descansos payloads). */
function parseISODateTime(v: string | undefined): Date | null {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

/* ----------------------------- Helpers ----------------------------- */

type DaySlot = { index: number; start: Date; end: Date; keyStart: string; keyEnd: string };

export function getDaySlots(inputs: InputsMap): DaySlot[] {
    const numDaysInput = inputs["NumberOfDays"] as HTMLInputElement | undefined;
    const n = numDaysInput ? Number(numDaysInput.value) : 0;
    const slots: DaySlot[] = [];
    for (let i = 1; i <= n; i++) {
        const keyStart = `Dia ${i} Start`;
        const keyEnd = `Dia ${i} End`;
        const s = parseFlexibleDateTime(inputs[keyStart] as HTMLInputElement);
        const e = parseFlexibleDateTime(inputs[keyEnd] as HTMLInputElement);
        if (s && e && s < e) slots.push({ index: i, start: s, end: e, keyStart, keyEnd });
    }
    return slots;
}

function isWithinSlot(start: Date, end: Date, slot: DaySlot): boolean {
    return start >= slot.start && end <= slot.end;
}

function stripToLocalMidnight(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function ymdNumber(d: Date) {
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
function isExactLocalMidnight(d: Date) {
    return d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;
}

/**
 * Return all local calendar YMDs covered by [slot.start, slot.end] in a *day sense*.
 * If slot.end is exactly local 00:00, treat the last day as *exclusive* (half-open).
 */
function slotCoveredYMDs(slot: DaySlot): Set<number> {
    const firstDay = stripToLocalMidnight(slot.start);
    const lastDay = stripToLocalMidnight(slot.end);
    const lastInclusive = new Date(lastDay.getTime());
    if (isExactLocalMidnight(slot.end)) {
        lastInclusive.setDate(lastInclusive.getDate() - 1);
    }
    const out = new Set<number>();
    const cur = new Date(firstDay.getTime());
    while (ymdNumber(cur) <= ymdNumber(lastInclusive)) {
        out.add(ymdNumber(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return out;
}

function formatDateRange(d: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/* ------------------ Existing (numeric live) ------------------ */

export function installStaticFieldValidation(inputs: InputsMap) {
    for (const field of STATIC_FIELDS) {
        const input = inputs[field] as HTMLInputElement | undefined;
        if (!input) continue;

        if (input.type === "number") {
            input.min = input.min || "0";
            input.step = input.step || "1";
            input.addEventListener("input", () => {
                const val = Number(input.value);
                if (input.value !== "" && (isNaN(val) || val < Number(input.min))) {
                    setError(input, "Debe ser un número válido y no negativo.");
                } else {
                    setError(input);
                }
            });
        }
    }
}

/* ------------------ Static fields required ------------------ */

export function validateStaticFields(inputs: InputsMap): boolean {
    let ok = true;

    for (const field of STATIC_FIELDS) {
        const input = inputs[field] as HTMLInputElement | undefined;
        if (!input) continue;

        setError(input); // clear

        if (!input.value) {
            setError(input, "Obligatorio.");
            ok = false;
        } else if (input.type === "number") {
            const val = Number(input.value);
            if (isNaN(val) || (input.min && val < Number(input.min))) {
                setError(input, "Debe ser un número válido y no negativo.");
                ok = false;
            }
        }
    }

    return ok;
}

export function runValidators(validators: Array<() => boolean>): boolean {
    let ok = true;
    for (const v of validators) ok = v() && ok;
    return ok;
}

/* ------------------ Modalidad / Circuitos ------------------ */

export function validateModalidadYCircuitos(options: {
    modalidadSelect: HTMLSelectElement;
    circuitos: Circuito[];
    circuitosContainer: HTMLElement;
    errorSummary: HTMLElement;
}): boolean {
    const { modalidadSelect, circuitos, circuitosContainer, errorSummary } = options;
    let ok = true;

    const modalidad = modalidadSelect.value;
    if (!modalidad) {
        setError(modalidadSelect, "Selecciona una modalidad.");
        ok = false;
    } else {
        setError(modalidadSelect);
    }

    if (modalidad === "Estructurado") {
        if (circuitos.length === 0) {
            showErrorSummary(errorSummary, "Debes añadir al menos una fase de escrutinio para la modalidad Estructurado.");
            return false;
        }

        const circuitoInputs = circuitosContainer.querySelectorAll('input[type="number"]') as NodeListOf<HTMLInputElement>;
        circuitoInputs.forEach((inp) => {
            const n = Number(inp.value);
            if (inp.value === "" || !Number.isFinite(n) || n < 1 || !Number.isInteger(n)) {
                setError(inp, "Introduce un entero positivo (min. 1).");
                ok = false;
            } else {
                setError(inp);
            }
        });
    }

    return ok;
}

/* ------------------ Error summary helpers ------------------ */

export function clearErrorSummary(errorSummary: HTMLElement) {
    errorSummary.classList.add("hidden");
    errorSummary.textContent = "";
}

export function showErrorSummary(errorSummary: HTMLElement, msg: string) {
    errorSummary.classList.remove("hidden");
    errorSummary.textContent = msg;
    (errorSummary as HTMLElement).focus();
}

/* --------- Día de Escrutinio (calendar-day only, live-friendly) --------- */

export function validateDiaEscrutinioWithinDays(options: {
    inputs: InputsMap;
}): boolean {
    const { inputs } = options;
    const diaInput = inputs["Dia de Escrutinio"] as HTMLInputElement | undefined;
    if (!diaInput) return true;

    // Optional
    if (!diaInput.value) {
        setError(diaInput);
        return true;
    }

    const diaYmd = parseDateOnlyToYMD(diaInput.value);
    if (diaYmd === null) {
        setError(diaInput, "Fecha inválida.");
        return false;
    }

    const slots = getDaySlots(inputs);
    if (slots.length === 0) {
        setError(diaInput, "Define primero los días de competición.");
        return false;
    }

    const covered = new Set<number>();
    for (const slot of slots) {
        for (const ymd of slotCoveredYMDs(slot)) covered.add(ymd);
    }

    if (!covered.has(diaYmd)) {
        setError(diaInput, "Debe estar dentro de los días de competición.");
        return false;
    }

    setError(diaInput);
    return true;
}

/* ------------------ Descansos vs Días ------------------ */

export function validateDescansosAgainstDays(options: {
    descansos: Descanso[];
    inputs: InputsMap;
    errorSummary: HTMLElement;
}): boolean {
    const { descansos, inputs, errorSummary } = options;

    if (!descansos || descansos.length === 0) return true;

    const slots = getDaySlots(inputs);
    const messages: string[] = [];
    let ok = true;

    type Checked = { idx: number; name: string; start: Date; end: Date };
    const validOnes: Checked[] = [];

    const seenNames = new Set<string>();
    const dupNames = new Set<string>();

    descansos.forEach((d, idx) => {
        const name = (d.name || "").trim();

        const s = parseISODateTime(d.start) ?? parseLocaleDateTimeString(d.start || "");
        const e = parseISODateTime(d.end) ?? parseLocaleDateTimeString(d.end || "");

        if (!name && !d.start && !d.end) {
            return; // blank row -> ignored
        }

        if (!name) {
            ok = false;
            messages.push(`Descanso #${idx + 1}: el nombre es obligatorio.`);
        } else {
            if (seenNames.has(name)) dupNames.add(name);
            seenNames.add(name);
        }

        if (!s || !e) {
            ok = false;
            messages.push(`Descanso "${name || `#${idx + 1}`}" tiene fecha/hora inválida o incompleta.`);
        } else {
            if (e <= s) {
                ok = false;
                messages.push(`Descanso "${name}": la hora de fin debe ser posterior al inicio.`);
            } else {
                validOnes.push({ idx, name, start: s, end: e });
            }
        }
    });

    if (dupNames.size > 0) {
        ok = false;
        messages.push(`Nombres duplicados de descanso: ${[...dupNames].join(", ")}.`);
    }

    if (slots.length === 0 && validOnes.length > 0) {
        ok = false;
        messages.push("Define correctamente los días de competición (inicio y fin) antes de añadir descansos.");
    }

    // Dentro de un único Día
    for (const d of validOnes) {
        const matching = slots.find((slot) => isWithinSlot(d.start, d.end, slot));
        if (!matching) {
            ok = false;
            messages.push(
                `Descanso "${d.name}" (${formatDateRange(d.start)} → ${formatDateRange(d.end)}) no cae íntegramente dentro de ningún Día.`
            );
        }
    }

    // No cruzar días
    for (const d of validOnes) {
        const slotStart = slots.find((slot) => d.start >= slot.start && d.start <= slot.end);
        const slotEnd = slots.find((slot) => d.end >= slot.start && d.end <= slot.end);
        if (slotStart && slotEnd && slotStart.index !== slotEnd.index) {
            ok = false;
            messages.push(`Descanso "${d.name}" no puede cruzar de Día ${slotStart.index} a Día ${slotEnd.index}.`);
        }
    }

    // Sin solapamientos
    const sorted = [...validOnes].sort((a, b) => a.start.getTime() - b.start.getTime());
    for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i];
        const b = sorted[i + 1];
        if (a.end > b.start) {
            ok = false;
            messages.push(`Los descansos "${a.name}" y "${b.name}" se solapan.`);
        }
    }

    if (!ok && messages.length > 0) {
        showErrorSummary(errorSummary, messages.join(" "));
    }

    // Best-effort de marcado de campos
    if (!ok) {
        descansos.forEach((d) => {
            const name = (d.name || "").trim();
            const startEl = inputs[`Descanso ${name} Start`] as HTMLInputElement | undefined;
            const endEl = inputs[`Descanso ${name} End`] as HTMLInputElement | undefined;

            const s = parseISODateTime(d.start) ?? parseLocaleDateTimeString(d.start || "");
            const e = parseISODateTime(d.end) ?? parseLocaleDateTimeString(d.end || "");

            if (startEl) setError(startEl);
            if (endEl) setError(endEl);

            if (!name || !s || !e || (s && e && e <= s)) {
                if (startEl) setError(startEl, "Revisa este descanso.");
                if (endEl) setError(endEl, "Revisa este descanso.");
                return;
            }

            const matching = slots.find((slot) => isWithinSlot(s, e, slot));
            if (!matching) {
                if (startEl) setError(startEl, "Fuera de los días definidos.");
                if (endEl) setError(endEl, "Fuera de los días definidos.");
            }
        });
    }

    return ok;
}

/* ------------------ Orchestrator ------------------ */

export function validateForm(options: {
    inputs: InputsMap;
    dayValidators: Array<() => boolean>;
    descansoValidators: Array<() => boolean>;
    modalidadSelect: HTMLSelectElement;
    circuitos: Circuito[];
    circuitosContainer: HTMLElement;
    errorSummary: HTMLElement;
    descansos: Descanso[];
}): boolean {
    const {
        inputs,
        dayValidators,
        descansoValidators,
        modalidadSelect,
        circuitos,
        circuitosContainer,
        errorSummary,
        descansos,
    } = options;

    clearErrorSummary(errorSummary);

    let ok = true;

    ok = validateStaticFields(inputs) && ok;

    // Validate days first so slots are accurate
    ok = runValidators(dayValidators) && ok;

    // Día de Escrutinio (inline only)
    ok = validateDiaEscrutinioWithinDays({ inputs }) && ok;

    // Descansos
    ok = runValidators(descansoValidators) && ok;
    ok = validateDescansosAgainstDays({ descansos, inputs, errorSummary }) && ok;

    // Modalidad / Circuitos
    const modalidadOk = validateModalidadYCircuitos({
        modalidadSelect,
        circuitos,
        circuitosContainer,
        errorSummary,
    });
    ok = modalidadOk && ok;

    if (!ok && errorSummary.classList.contains("hidden")) {
        showErrorSummary(
            errorSummary,
            "Revisa los campos marcados. Algunos valores son obligatorios o no cumplen las reglas."
        );
    }

    return ok;
}
