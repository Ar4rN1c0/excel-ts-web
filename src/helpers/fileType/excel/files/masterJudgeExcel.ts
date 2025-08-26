import { Juez, TipoJuez } from "../../../../types/types";
import ExcelJS from "exceljs"
import { downloadWorkbook } from "../excelUtils";
import { addJudgeLegend, formatActivityName, formatDayName, formatTimeRange, getChangeTimesForDay } from "../output_utils";
/**
 * Gantt maestro por jueces con eje Y dinámico (intervalos entre todos los starts y ends).
 */
export async function generarExcelMasterJueces(jueces: Juez[]) {
  const wb = new ExcelJS.Workbook();

  const allEvents = jueces.flatMap(juez => juez.horario);
  if (allEvents.length === 0) {
    const ws = wb.addWorksheet('Sin eventos');
    ws.addRow(['No hay eventos programados']);
    await downloadWorkbook(wb, 'Horario_Jueces_Gantt.xlsx');
    return;
  }

  // Agrupar por día
  const eventsByDay = new Map<string, typeof allEvents>();
  allEvents.forEach(event => {
    const dayKey = event.start.toDateString();
    if (!eventsByDay.has(dayKey)) eventsByDay.set(dayKey, []);
    eventsByDay.get(dayKey)!.push(event);
  });

  for (const [dayKey, dayEvents] of eventsByDay) {
    const dayDate = new Date(dayKey);
    const ws = wb.addWorksheet(formatDayName(dayDate));

    // Jueces con eventos ese día
    const judgesThisDay = jueces.filter(juez =>
      juez.horario.some(event => event.start.toDateString() === dayKey)
    );
    if (judgesThisDay.length === 0) continue;

    // Puntos de cambio del día
    const changeTimes = getChangeTimesForDay(dayEvents);

    // Cabecera
    const headerRow = ['Hora'];
    judgesThisDay.forEach(juez => headerRow.push(`${juez.nombre} (${juez.tipo})`));
    ws.addRow(headerRow);
    const headerRowObj = ws.getRow(1);
    headerRowObj.font = { bold: true };
    headerRowObj.height = 20;

    // Colores por tipo de juez
    const judgeColors: Record<TipoJuez, string> = {
      'Portfolio Técnico': 'FF66B3FF',
      'Portfolio de Empresa': 'FF9999FF',
      'Presentación Verbal': 'FFFF66FF',
      'Escrutinio': 'FFB3FFB3',
      'Registro': 'FFFF9999'
    };

    // Filas por intervalos [t_i, t_{i+1})
    for (let i = 0; i < changeTimes.length - 1; i++) {
      const intervalStart = changeTimes[i];
      const intervalEnd = changeTimes[i + 1];
      if (intervalEnd.getTime() <= intervalStart.getTime()) continue;

      const rowValues: ExcelJS.CellValue[] = [formatTimeRange(intervalStart, intervalEnd)];

      // Texto por juez si solapa el intervalo
      judgesThisDay.forEach(juez => {
        const ev = juez.horario
          .filter(e => e.nombre !== "Descanso" && e.start.toDateString() === dayKey)
          .find(e => intervalStart < e.end && intervalEnd > e.start);

        if (!ev) {
          rowValues.push('');
        } else {
          // Para jueces mostramos el tipo del evento
          rowValues.push(formatActivityName(ev.tipo, ''));
        }
      });

      const row = ws.addRow(rowValues);

      // Estilo por celda según tipo de juez (constante por columna)
      judgesThisDay.forEach((juez, jIndex) => {
        const colIndex = jIndex + 2;
        const cell = row.getCell(colIndex);
        const hasText = !!String(cell.value || '');
        if (!hasText) return;

        const color = judgeColors[juez.tipo] || 'FFCCCCCC';
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.font = { size: 8 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });
    }

    // Anchos
    ws.getColumn(1).width = 18;
    for (let i = 2; i <= judgesThisDay.length + 1; i++) ws.getColumn(i).width = 15;

    // Leyenda
    const legendStartRow = (ws.lastRow?.number || 1) + 2;
    addJudgeLegend(ws, legendStartRow, judgeColors);
  }

  await downloadWorkbook(wb, 'Horario_Jueces_Gantt.xlsx');
}