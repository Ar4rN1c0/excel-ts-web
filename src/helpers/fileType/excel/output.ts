// output.ts
import ExcelJS from 'exceljs';
import { Equipo, Juez, Evento } from '../../../types/types'; // Corregida la ruta de importación

export async function generarExcelEquipo(equipo: Equipo) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Horario');

  // Encabezados con estilo
  ws.addRow(['Actividad', 'Duración (min)', 'Inicio', 'Fin']);
  ws.getRow(1).font = { bold: true };

  // Datos ordenados por hora de inicio
  equipo.horario
    .filter(ev => ev.nombre !== "Descanso")
    .sort((a: Evento, b: Evento) => a.start.getTime() - b.start.getTime())
    .forEach((ev: Evento) => {
      ws.addRow([
        formatActivityName(ev.nombre, equipo.nombre),
        getDurationInMinutes(ev),
        formatDateTime(ev.start),
        formatDateTime(ev.end)
      ]);
    });

  // Autoajustar columnas con tipado seguro
  ws.columns.forEach(column => {
    if (column.values) {
      const maxLength = column.values.reduce((max: number, value: ExcelJS.CellValue) => {
        const length = value?.toString().length || 0;
        return Math.max(max, length);
      }, 0);
      column.width = Math.max(15, maxLength);
    }
  });

  await downloadWorkbook(wb, `Equipo_${equipo.nombre}_Horario.xlsx`);
}

export async function generarExcelMaster(equipos: Equipo[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Horario Maestro');

  ws.addRow(['Equipo', 'Categoría', 'Actividad', 'Duración (min)', 'Inicio', 'Fin']);
  ws.getRow(1).font = { bold: true };

  equipos.forEach(equipo => {
    equipo.horario
      .filter(ev => ev.nombre !== "Descanso")
      .sort((a: Evento, b: Evento) => a.start.getTime() - b.start.getTime())
      .forEach((ev: Evento) => {
        ws.addRow([
          equipo.nombre,
          equipo.categoria,
          formatActivityName(ev.nombre, equipo.nombre),
          getDurationInMinutes(ev),
          formatDateTime(ev.start),
          formatDateTime(ev.end)
        ]);
      });
  });

  // Autoajustar columnas con tipado seguro
  ws.columns.forEach(column => {
    if (column.values) {
      const maxLength = column.values.reduce((max: number, value: ExcelJS.CellValue) => {
        const length = value?.toString().length || 0;
        return Math.max(max, length);
      }, 0);
      column.width = Math.max(15, maxLength);
    }
  });

  await downloadWorkbook(wb, 'Horario_Maestro.xlsx');
}

export async function generarExcelMasterJueces(jueces: Juez[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Horario Jueces');

  ws.addRow(['Juez', 'Tipo', 'Actividad', 'Duración (min)', 'Inicio', 'Fin']);
  ws.getRow(1).font = { bold: true };

  jueces.forEach(juez => {
    juez.horario
      .filter(ev => ev.nombre !== "Descanso")
      .sort((a: Evento, b: Evento) => a.start.getTime() - b.start.getTime())
      .forEach((ev: Evento) => {
        ws.addRow([
          `Juez ${juez.tipo} ${juez.id}`,
          juez.tipo,
          formatActivityName(ev.tipo, ''),
          getDurationInMinutes(ev),
          formatDateTime(ev.start),
          formatDateTime(ev.end)
        ]);
      });
  });

  // Autoajustar columnas con tipado seguro
  ws.columns.forEach(column => {
    if (column.values) {
      const maxLength = column.values.reduce((max: number, value: ExcelJS.CellValue) => {
        const length = value?.toString().length || 0;
        return Math.max(max, length);
      }, 0);
      column.width = Math.max(15, maxLength);
    }
  });

  await downloadWorkbook(wb, 'Horario_Jueces_Maestro.xlsx');
}

export async function generarExcelJuez(juez: Juez) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Horario');

  ws.addRow(['Actividad', 'Duración (min)', 'Inicio', 'Fin']);
  ws.getRow(1).font = { bold: true };

  juez.horario
    .sort((a: Evento, b: Evento) => a.start.getTime() - b.start.getTime())
    .forEach((ev: Evento) => {
      ws.addRow([
        formatActivityName(ev.nombre, ''),
        getDurationInMinutes(ev),
        formatDateTime(ev.start),
        formatDateTime(ev.end)
      ]);
    });

  // Autoajustar columnas con tipado seguro
  ws.columns.forEach(column => {
    if (column.values) {
      const maxLength = column.values.reduce((max: number, value: ExcelJS.CellValue) => {
        const length = value?.toString().length || 0;
        return Math.max(max, length);
      }, 0);
      column.width = Math.max(15, maxLength);
    }
  });

  await downloadWorkbook(wb, `Juez_${juez.tipo}_${juez.id}_Horario.xlsx`);
}

// Funciones auxiliares con tipado explícito
async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string): Promise<void> {
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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

export function getDurationInMinutes(event: Evento): number {
  return Math.round((event.end.getTime() - event.start.getTime()) / 60000);
}

export function formatDateTime(date: Date): string {
  return date?.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) || '';
}