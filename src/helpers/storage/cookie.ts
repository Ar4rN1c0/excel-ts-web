import { Circuito, Descanso, InputsMap } from "../../types/types";

const CONFIG_FORM_COOKIE = "configFormData";
const COOKIE_EXPIRES_DAYS = 365;

export function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}
export function getCookie(name: string) {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r
  }, '');
}
export function eraseCookie(name: string) {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

export const saveToCookie = (data: Record<string, string>) =>
  setCookie(CONFIG_FORM_COOKIE, JSON.stringify(data), COOKIE_EXPIRES_DAYS);

export const loadFromCookie = (): Record<string, string> | undefined => {
  const cookie = getCookie(CONFIG_FORM_COOKIE);
  if (!cookie) return undefined;
  try {
    return JSON.parse(cookie);
  } catch {
    return undefined;
  }
};

export const saveAllInputsToCookie = (inputs: InputsMap, descansos: Descanso[], circuitos: Circuito[]) => {
  const data: Record<string, string> = {};
  for (const [k, input] of Object.entries(inputs)) data[k] = (input as HTMLInputElement | HTMLSelectElement).value;

  for (const d of descansos) {
    if (d.name) {
      data[`Descanso ${d.name} Start`] = d.start;
      data[`Descanso ${d.name} End`] = d.end;
    }
  }

  for (const c of circuitos) {
    if (c.fase && c.duracion !== "") {
      data[`Duración Escrutinio Fase ${c.fase}`] = String(c.duracion);
    }
  }

  saveToCookie(data);
};