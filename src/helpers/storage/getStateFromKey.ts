import { State } from "../../types/types";
import { parseStateFromJSON } from "../fileType/json/parseStateFromJSON";

export function getStateFromKey(key: string): State | null {
  const raw = localStorage.getItem(key);
  if(!raw) throw new Error("Unexisting key");
  return parseStateFromJSON(raw);
}