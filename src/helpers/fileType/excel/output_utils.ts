import { EventoTipo } from '../../../types/types';


/* ===================== Helpers ===================== */

// Eje Y dinámico: devuelve todos los tiempos de cambio (starts/ends), únicos y ordenados
export function getChangeTimesForDay(events: { start: Date; end: Date }[]): Date[] {
  const uniq = new Set<number>();
  events.forEach(ev => {
    if (ev?.start) uniq.add(new Date(ev.start).getTime());
    if (ev?.end) uniq.add(new Date(ev.end).getTime());
  });
  return Array.from(uniq).sort((a, b) => a - b).map(ms => new Date(ms));
}

// Etiqueta "HH:MM – HH:MM" para una fila de intervalo
export function formatTimeRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  return `${new Date(start).toLocaleTimeString('es-ES', opts)} – ${new Date(end).toLocaleTimeString('es-ES', opts)}`;
}

// Nombre de hoja por día
export function formatDayName(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return new Date(date).toLocaleDateString('es-ES', options).replace(/,/g, '');
}





// Detección del tipo de actividad para colorear
export function getActivityType(nombre: string, tipo: EventoTipo): string {
  const nombreLower = (nombre || '').toLowerCase();

  // Matches específicos primero
  if (nombreLower.includes('portfolio técnico') || nombreLower.includes('portfolio tecnico')) return 'Portfolio Técnico';
  if (nombreLower.includes('portfolio de empresa') || nombreLower.includes('portfolio empresa')) return 'Portfolio de Empresa';
  if (nombreLower.includes('presentación verbal') || nombreLower.includes('presentacion verbal')) return 'Presentación Verbal';
  if (nombreLower.includes('pit display')) return 'Montaje del Pit Display';
  if (nombreLower.includes('charla/presentación') || nombreLower.includes('charla/presentacion')) return 'Charla/Presentación';
  if (nombreLower.includes('eliminatorias') || nombreLower.includes('knockouts')) return 'Knockouts - Eliminatorias';
  if (nombreLower.includes('ceremonia') || nombreLower.includes('clausura') || nombreLower.includes('premios')) return 'Ceremonia de Clausura y Premios';
  if (nombreLower.includes('escrutinio')) return 'Escrutinio';
  if (nombreLower.includes('registro')) return 'Registro';
  if (nombreLower.includes('montaje')) return 'Montaje del Pit Display';
  if (nombreLower.includes('carrera') && !nombreLower.includes('ceremonia')) return 'Carrera';
  if (nombreLower.includes('charla') || nombreLower.includes('presentación')) return 'Charla/Presentación';

  // Fallback al tipo si nada coincide
  if (tipo === 'Race') return 'Carrera';
  if (tipo === 'Global Event') return 'Global Event';

  return 'Concurrent Activity'; // gris por defecto
}

// Formatea nombre de actividad visible
export function formatActivityName(activityType: string, teamName: string): string {
  const activityNames: Record<string, string> = {
    'Registro': `Registro ${teamName}`,
    'Charla Inicial': `Charla Inicial ${teamName}`,
    'Carrera Clasificatoria': `Carrera ${teamName}`,
    'Eliminatoria': `Eliminatoria ${teamName}`,
    'Juzgar Portfolio Técnico': 'Evaluación Portfolio Técnico',
    'Juzgar Portfolio de Empresa': 'Evaluación Portfolio Empresa',
    'Juzgar Presentación verbal': 'Evaluación Presentación Verbal'
  };

  return activityNames[activityType] || activityType;
}