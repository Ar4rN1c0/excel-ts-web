// helpers/validation/configFormValidation.ts
import { setError } from "../../lib/validationTools";
import { Circuito, Descanso, InputsMap, STATIC_FIELDS } from "../../types/types";

/* ----------------------------- Parsing ----------------------------- */

/** Parse "YYYY-MM-DD" WITHOUT timezone/hours and return a YMD number (null if invalid). */
function parseDateOnlyToYMD(v: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return y * 10000 + mo * 100 + d;
}

/** Parse "YYYY-MM-DDTHH:mm[:ss]" as a local Date. */
function parseDateTimeLocalString(v: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(v);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const hh = Number(m[4]), mm = Number(m[5]), ss = m[6] ? Number(m[6]) : 0;
  const dt = new Date(y, mo - 1, d, hh, mm, ss, 0);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  if (dt.getHours() !== hh || dt.getMinutes() !== mm || dt.getSeconds() !== ss) return null;
  return dt;
}

/**
 * Parse locale-ish strings like "13/12/2025, 09:00 AM" or "13/12/2025 09:00 p. m."
 * Prefers dd/mm/yyyy (EU). If mid > 12, swaps to mm/dd when needed.
 */
function parseLocaleDateTimeString(v: string): Date | null {
  if (!v) return null;
  const raw = v.replace(/\u202F|\u00A0/g, " ").replace(/\s+/g, " ").trim();

  // split date/time around comma if present; else attempt last-space split
  const parts = raw.split(",").map(s => s.trim());
  let datePart = parts[0] || "";
  let timePart = (parts[1] || "").trim();

  if (!timePart && /\d{1,2}:\d{2}/.test(datePart)) {
    const m = /(.*)\s+(\d{1,2}:\d{2}(?:\s*.*)?)$/i.exec(datePart);
    if (m) { datePart = m[1].trim(); timePart = m[2].trim(); }
  }

  // dd/mm/yyyy or mm/dd/yyyy
  const dm = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(datePart);
  if (!dm) {
    const nd = new Date(raw);
    return isNaN(nd.getTime()) ? null : nd;
  }
  let d = Number(dm[1]), m = Number(dm[2]); const y = Number(dm[3]);
  if (m > 12 && d <= 12) { const t = d; d = m; m = t; }

  const validDate = new Date(y, m - 1, d);
  if (validDate.getFullYear() !== y || validDate.getMonth() !== m - 1 || validDate.getDate() !== d) return null;

  // time (+ AM/PM in EN or ES like "a. m." / "p. m.")
  let hh = 0, mmn = 0;
  if (timePart) {
    const tm = /^(\d{1,2}):(\d{2})(?:\s*([APap]\.? ?[Mm]\.?)?)$/.exec(timePart);
    if (!tm) return null;
    hh = Number(tm[1]); mmn = Number(tm[2]);
    const apRaw = tm[3];
    if (apRaw) {
      const ap = apRaw.replace(/\./g, "").replace(/\s+/g, "").toUpperCase(); // "AM"/"PM"
      if (ap === "AM") { if (hh === 12) hh = 0; }
      else if (ap === "PM") { if (hh !== 12) hh += 12; }
    }
    if (hh < 0 || hh > 23 || mmn < 0 || mmn > 59) return null;
  }

  return new Date(y, m - 1, d, hh, mmn, 0, 0);
}

/** Parse from an <input>; tries datetime-local, then native, then locale. */
function parseFlexibleDateTime(input?: HTMLInputElement): Date | null {
  if (!input) return null;
  const raw = input.value?.trim();
  if (!raw) return null;

  if (input.type === "datetime-local") {
    const dt = parseDateTimeLocalString(raw);
    if (dt) return dt;
  }
  const isoTry = new Date(raw);
  if (!isNaN(isoTry.getTime())) return isoTry;

  return parseLocaleDateTimeString(raw);
}

/**
 * Parse direct string values:
 *  - If it looks like datetime-local → parse as local
 *  - Else use Date ctor (time-zoned strings)
 */
function parseISODateTime(v: string | undefined): Date | null {
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(v)) {
    return parseDateTimeLocalString(v);
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

/* ----------------------------- Helpers ----------------------------- */

type DaySlot = { index: number; start: Date; end: Date; keyStart: string; keyEnd: string };

export function getDaySlots(inputs: InputsMap): DaySlot[] {
  const n = Number((inputs["NumberOfDays"] as HTMLInputElement | undefined)?.value || 0);
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

/** All local calendar YMDs covered by [slot.start, slot.end] (end at 00:00 is exclusive). */
function slotCoveredYMDs(slot: DaySlot): Set<number> {
  const firstDay = stripToLocalMidnight(slot.start);
  const lastDay = stripToLocalMidnight(slot.end);
  const lastInclusive = new Date(lastDay.getTime());
  if (isExactLocalMidnight(slot.end)) lastInclusive.setDate(lastInclusive.getDate() - 1);
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

/* ------------------ Numeric live validation ------------------ */

/** Fields that must be ≥ 1 (tolerates common accent/no-accent variants). */
const FIELDS_MIN_ONE = new Set<string>([
  "Número de Carreras Simultáneas",
  "Numero de Carreras Simultaneas",
  "Nº de Carreras Simultáneas",
  "Num. de Carreras Simultáneas",
  "Nº de carreras a la vez"
]);

export function installStaticFieldValidation(inputs: InputsMap) {
  for (const field of STATIC_FIELDS) {
    const input = inputs[field] as HTMLInputElement | undefined;
    if (!input) continue;
    if (input.type === "number") {
      input.min = input.min || "0";
      input.step = input.step || "1";
      input.addEventListener("input", () => {
        const raw = input.value;
        const val = Number(raw);
        const baseMin = input.min !== "" ? Number(input.min) : 0;
        const requiredMin = FIELDS_MIN_ONE.has(field) ? Math.max(1, baseMin) : baseMin;

        if (raw !== "" && Number.isNaN(val)) { setError(input, "Debe ser un número válido."); return; }
        if (raw !== "" && val < requiredMin) {
          setError(input, requiredMin === 0 ? "Debe ser un número válido y no negativo." : `Debe ser al menos ${requiredMin}.`);
          return;
        }
        setError(input);
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
      const baseMin = input.min !== "" ? Number(input.min) : 0;
      const requiredMin = FIELDS_MIN_ONE.has(field) ? Math.max(1, baseMin) : baseMin;

      if (Number.isNaN(val)) {
        setError(input, "Debe ser un número válido."); ok = false;
      } else if (val < requiredMin) {
        setError(input, requiredMin === 0 ? "Debe ser un número válido y no negativo." : `Debe ser al menos ${requiredMin}.`);
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
  if (!modalidad) { setError(modalidadSelect, "Selecciona una modalidad."); ok = false; }
  else setError(modalidadSelect);

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
      } else setError(inp);
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

/* --------- Día de Escrutinio (calendar-day only) --------- */

export function validateDiaEscrutinioWithinDays(options: { inputs: InputsMap; }): boolean {
  const { inputs } = options;
  const diaInput = inputs["Dia de Escrutinio"] as HTMLInputElement | undefined;
  if (!diaInput) return true;

  if (!diaInput.value) { setError(diaInput); return true; }

  const diaYmd = parseDateOnlyToYMD(diaInput.value);
  if (diaYmd === null) { setError(diaInput, "Fecha inválida."); return false; }

  const slots = getDaySlots(inputs);
  if (slots.length === 0) { setError(diaInput, "Define primero los días de competición."); return false; }

  const covered = new Set<number>();
  for (const slot of slots) for (const ymd of slotCoveredYMDs(slot)) covered.add(ymd);
  const ok = covered.has(diaYmd);
  setError(diaInput, ok ? undefined : "Debe estar dentro de los días de competición.");
  return ok;
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

    // Try DOM inputs first (keeps local semantics), then saved strings.
    const startEl = name ? (inputs[`Descanso ${name} Start`] as HTMLInputElement | undefined) : undefined;
    const endEl   = name ? (inputs[`Descanso ${name} End`] as HTMLInputElement | undefined) : undefined;

    const s = parseFlexibleDateTime(startEl) ?? parseISODateTime(d.start) ?? parseLocaleDateTimeString(d.start || "");
    const e = parseFlexibleDateTime(endEl)   ?? parseISODateTime(d.end)   ?? parseLocaleDateTimeString(d.end || "");

    if (!name && !d.start && !d.end) return; // ignore blank row

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
    } else if (e <= s) {
      ok = false;
      messages.push(`Descanso "${name}": la hora de fin debe ser posterior al inicio.`);
    } else {
      validOnes.push({ idx, name, start: s, end: e });
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
      messages.push(`Descanso "${d.name}" (${formatDateRange(d.start)} → ${formatDateRange(d.end)}) no cae íntegramente dentro de ningún Día.`);
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
    const a = sorted[i], b = sorted[i + 1];
    if (a.end > b.start) {
      ok = false;
      messages.push(`Los descansos "${a.name}" y "${b.name}" se solapan.`);
    }
  }

  if (!ok && messages.length > 0) showErrorSummary(errorSummary, messages.join(" "));

  // Mark fields (best effort)
  if (!ok) {
    descansos.forEach((d) => {
      const name = (d.name || "").trim();
      const startEl = inputs[`Descanso ${name} Start`] as HTMLInputElement | undefined;
      const endEl = inputs[`Descanso ${name} End`] as HTMLInputElement | undefined;

      const s = parseFlexibleDateTime(startEl) ?? parseISODateTime(d.start) ?? parseLocaleDateTimeString(d.start || "");
      const e = parseFlexibleDateTime(endEl)   ?? parseISODateTime(d.end)   ?? parseLocaleDateTimeString(d.end || "");

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
  ok = runValidators(dayValidators) && ok;
  ok = validateDiaEscrutinioWithinDays({ inputs }) && ok;
  ok = runValidators(descansoValidators) && ok;
  ok = validateDescansosAgainstDays({ descansos, inputs, errorSummary }) && ok;
  ok = validateModalidadYCircuitos({ modalidadSelect, circuitos, circuitosContainer, errorSummary }) && ok;

  if (!ok && errorSummary.classList.contains("hidden")) {
    showErrorSummary(errorSummary, "Revisa los campos marcados. Algunos valores son obligatorios o no cumplen las reglas.");
  }
  return ok;
}
