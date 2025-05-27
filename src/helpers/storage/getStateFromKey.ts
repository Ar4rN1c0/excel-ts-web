import { State } from "../../types/types";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function dateReviver(_key: string, value: any) {
  if (typeof value === "string" && ISO_DATE_REGEX.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return value;
}

export function getStateFromKey(key: string): State | null {
  const raw = localStorage.getItem(key);
  if (typeof raw !== "string" || !raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw, dateReviver);
    if (
      parsed &&
      Array.isArray(parsed.teams) &&
      Array.isArray(parsed.judges)
    ) {
      return parsed as State;
    }
    console.warn("Parsed value does not match State type:", parsed);
    return null;
  } catch (e) {
    console.error("Invalid JSON in localStorage for key", key, e);
    return null;
  }
}
