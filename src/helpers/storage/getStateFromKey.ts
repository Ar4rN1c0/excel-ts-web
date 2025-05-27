import { State } from "../../types/types";

// Improved ISO 8601 regex (matches most output from JSON.stringify(new Date()))
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
    // Not found or empty
    return null;
  }
  try {
    // Try to parse using the date reviver
    const parsed = JSON.parse(raw, dateReviver);
    // Optionally validate the parsed structure here:
    if (
      parsed &&
      Array.isArray(parsed.teams) &&
      Array.isArray(parsed.judges)
    ) {
      return parsed as State;
    }
    // Not valid State structure
    console.warn("Parsed value does not match State type:", parsed);
    return null;
  } catch (e) {
    console.error("Invalid JSON in localStorage for key", key, e);
    return null;
  }
}
