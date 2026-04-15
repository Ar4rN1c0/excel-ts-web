import ExcelJS from 'exceljs';
import { Evento } from '../../../types/types';


export function getDurationInMinutes(event: Evento): number {
  return Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000);
}

export function formatDateTime(date: Date): string {
  return date
    ? new Date(date).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';
}

// Descarga del workbook en browser
export async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string): Promise<void> {
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}


// put near the top
export const solidFill = (argb: string): ExcelJS.FillPattern => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb }
});
