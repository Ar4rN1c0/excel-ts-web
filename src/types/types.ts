// types/types.ts
export type Categoria = 'Entry' | 'Development' | 'Professional';
export type TipoJuez = 'Portfolio Técnico' | 'Portfolio de Empresa' | 'Presentación Verbal' | "Escrutinio";

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
  id: number;
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
  duration: number; // minutos
  heatsPerCategory: Record<Categoria, { min: number; max: number }>;
};


// Este tipo captura las claves como "Dia 1 Start", "Dia 2 End", etc.
type DynamicDayFields = {
  [key in `Dia ${number} ${"Start" | "End"}`]?: string;
};

// Este tipo define la estructura fija del objeto
interface StaticConfig {
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
  "Duración Carrera": number;
  "Tiempo Eliminatorias": number;
  rounds: {
    Entry: number;
    Development: number;
    Professional: number;
  };
}

// Tipo final combinando estructura fija y campos dinámicos
export type GlobalConfig = StaticConfig & DynamicDayFields;

export type Priorities = {
  [K in Categoria]?: number;
};


export type State = {
  teams: Equipo[],
  judges: Juez[]
}