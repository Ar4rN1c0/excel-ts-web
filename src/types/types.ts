// types/types.ts
export type Categoria = 'Entry' | 'Development' | 'Professional';
export type TipoJuez = 'Portfolio Técnico' | 'Portfolio de Empresa' | 'Presentación Verbal' | "Escrutinio" | 'Registro';

export type EventoTipo =
  | "Concurrent Activity"
  | "Global Event"
  | "Race"

export interface Evento {
  tipo: EventoTipo;
  start: Date;
  end: Date;
  duracion: number;
  nombre: string;
}

export interface Equipo {
  id: number;
  nombre: string;
  categoria: Categoria;
  horario: Evento[];
}

export interface Juez {
  id: string;
  tipo: TipoJuez;
  horario: Evento[];
  nombre: `${TipoJuez} ${number}`
}

export interface Config {
  windows: Array<{ start: Date; end: Date }>;
  JUDGES: Record<TipoJuez, number>;
  REGISTRATION_STAFF: number;
  QUALIFYING_RACES_PER_TEAM: number;
  RACE_DURATION_MIN: Record<Categoria, number>;
  ELIM_TEAMS: number;
}

export type DurationMap = Record<Categoria, number>;


export type RaceConfig = {
  duration: Record<Categoria, number>; // minutos por categoría
  heatsPerCategory: Record<Categoria, { min: number; max: number }>;
};


// Este tipo captura las claves como "Dia 1 Start", "Dia 2 End", etc.
export type DynamicDayFields = {
  [key in `Dia ${number} ${"Start" | "End"}`]?: string;
};
export type DynamicDescansoFields = {
  [key in `Descanso ${string} ${"Start" | "End"}`]?: string;
};

export type DynamicCircuitFields = {
  [key in `Duración Escrutinio Fase ${number}`]?: number
}


// Este tipo define la estructura fija del objeto
export interface StaticConfig {
  "Nº equipos de Entry": number;
  "Nº equipos de Development": number;
  "Nº equipos de Professional": number;
  "Nº de equipos que se clasifican": number;
  "Nº de Jueces para el portfolio técnico": number;
  "Nº de Jueces para el portfolio de empresa": number;
  "Nº de Jueces para el escrutinio": number;
  "Nº de Jueces para la presentación verbal": number;
  "Nº de personal para el registro": number;
  "Carreras Entry": number;
  "Carreras Development": number;
  "Carreras Professional": number;
  "NumberOfDays": number;
  "Duración registro": number;
  "Duración Charla/Presentación": number;
  "Duración Montaje del Pit Display": number;
  "Duración Escrutinio Entry": number;
  "Duración Escrutinio Development": number;
  "Duración Escrutinio Professional": number;
  "Duración Portfolio Técnico Entry": number;
  "Duración Portfolio Técnico Development": number;
  "Duración Portfolio Técnico Professional": number;
  "Duración Portfolio Empresa Entry": number;
  "Duración Portfolio Empresa Development": number;
  "Duración Portfolio Empresa Professional": number;
  "Duración Presentación Verbal Entry": number;
  "Duración Presentación Verbal Development": number;
  "Duración Presentación Verbal Professional": number;
  "Duración Ceremonia de Clausura y Premios": number;
  "Duración Carrera Entry": number;
  "Duración Carrera Development": number;
  "Duración Carrera Professional": number;
  "Duración Knockouts - Eliminatorias": number,
  "Nº de carreras a la vez": number;
  "Dia de Escrutinio"?: string,
  "Modalidad de Escrutinio": "Estructurado" | "Desestructurado",

}

// Tipo final combinando estructura fija y campos dinámicos
export type GlobalConfig = StaticConfig & DynamicDayFields & DynamicDescansoFields & DynamicCircuitFields;

export type Priorities = {
  [K in Categoria]?: number;
};


export type State = {
  teams: Equipo[],
  judges: Juez[]
}

export type Assignation = {
  judge: Juez;
  event: Evento;
  team: string;
}

export const STATIC_FIELDS: (keyof StaticConfig)[] = [
  "Nº equipos de Entry",
  "Nº equipos de Development",
  "Nº equipos de Professional",
  "Nº de Jueces para el portfolio técnico",
  "Nº de Jueces para el portfolio de empresa",
  "Nº de Jueces para el escrutinio",
  "Nº de Jueces para la presentación verbal",
  "Nº de personal para el registro",
  "Carreras Entry",
  "Carreras Development",
  "Carreras Professional",
  "NumberOfDays",
  "Duración registro",
  "Duración Charla/Presentación",
  "Duración Montaje del Pit Display",
  "Duración Escrutinio Entry",
  "Duración Escrutinio Development",
  "Duración Escrutinio Professional",
  "Duración Portfolio Técnico Entry",
  "Duración Portfolio Técnico Development",
  "Duración Portfolio Técnico Professional",
  "Duración Portfolio Empresa Entry",
  "Duración Portfolio Empresa Development",
  "Duración Portfolio Empresa Professional",
  "Duración Presentación Verbal Entry",
  "Duración Presentación Verbal Development",
  "Duración Presentación Verbal Professional",
  "Duración Ceremonia de Clausura y Premios",
  "Duración Carrera Entry",
  "Duración Carrera Development",
  "Duración Carrera Professional",
  "Duración Knockouts - Eliminatorias",
  "Nº de carreras a la vez",
];



export type InputsMap = Record<string, HTMLInputElement | HTMLSelectElement>;
export type Descanso = { name: string; start: string; end: string };
export type Circuito = { fase: number; duracion: number | "" };
