// generarExcelMaster.ts (5-minute slot rows)
import ExcelJS from "exceljs";
import { Equipo } from "../../../../types/types";
import { downloadWorkbook } from "../excelUtils";
import {
  formatActivityName,
  formatDayName,
  formatTimeRange,
  getActivityType,
  // getChangeTimesForDay,   // ⟵ no longer needed
} from "../output_utils";

/** Helpers for 5-minute slots */
const FIVE_MIN_MS = 5 * 60 * 1000;

function floorTo5Min(d: Date): Date {
  const t = d.getTime();
  const floored = Math.floor(t / FIVE_MIN_MS) * FIVE_MIN_MS;
  return new Date(floored);
}
function ceilTo5Min(d: Date): Date {
  const t = d.getTime();
  const ceiled = Math.ceil(t / FIVE_MIN_MS) * FIVE_MIN_MS;
  return new Date(ceiled);
}
function* generate5MinSlots(start: Date, end: Date): Generator<Date> {
  for (let t = start.getTime(); t < end.getTime(); t += FIVE_MIN_MS) {
    yield new Date(t);
  }
}

/**
 * Build (but do not download) the formatted master Gantt workbook with clean minimal styling.
 */
export async function buildMasterGanttWorkbook(
  equipos: Equipo[]
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();

  // Set workbook properties
  wb.creator = "Tournament Scheduler";
  wb.created = new Date();
  wb.subject = "Master Tournament Schedule";

  // Todos los eventos
  const allEvents = equipos.flatMap(equipo => equipo.horario);
  if (allEvents.length === 0) {
    const ws = wb.addWorksheet("Sin eventos");
    ws.addRow(["No hay eventos programados"]);
    return wb;
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

    // Equipos con eventos ese día
    const teamsThisDay = equipos.filter(equipo =>
      equipo.horario.some(event => event.start.toDateString() === dayKey)
    );
    if (teamsThisDay.length === 0) continue;

    // Determine fixed 5-minute grid bounds for the day
    const minStart = floorTo5Min(
      new Date(Math.min(...dayEvents.map(ev => ev.start.getTime())))
    );
    const maxEnd = ceilTo5Min(
      new Date(Math.max(...dayEvents.map(ev => ev.end.getTime())))
    );

    // Simple day title
    const dayTitle = formatDayName(dayDate);
    const titleRow = ws.addRow([dayTitle]);
    titleRow.height = 40;
    const titleCell = titleRow.getCell(1);
    titleCell.font = { size: 16, bold: true, color: { argb: "FF2C3E50" } };
    titleCell.alignment = { horizontal: "left", vertical: "middle" };

    const totalCols = teamsThisDay.length + 1;
    try {
      ws.mergeCells(titleRow.number, 1, titleRow.number, totalCols);
    } catch {
      console.warn("Title merge failed, using single cell");
    }

    // Spacing row
    ws.addRow([]);

    // Clean column headers
    const headerRow = ["Horario", ...teamsThisDay.map(e => `${e.nombre} (${e.categoria})`)];
    const headerRowObj = ws.addRow(headerRow);
    headerRowObj.height = 30;
    headerRowObj.font = { bold: true, size: 11, color: { argb: "FF2C3E50" } };
    headerRowObj.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FA" } };
    headerRowObj.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    for (let col = 1; col <= totalCols; col++) {
      headerRowObj.getCell(col).border = {
        bottom: { style: "medium", color: { argb: "FF2C3E50" } },
      };
    }

    // Simplified activity colors
    const activityColors: Record<string, string> = {
      "Registro": "FFFFE6E6",
      "Charla/Presentación": "FFFFF0E6",
      "Montaje del Pit Display": "FFFFF5E6",
      "Escrutinio": "FFE8F5E8",
      "Portfolio Técnico": "FFE6F3FF",
      "Portfolio de Empresa": "FFF0E6FF",
      "Presentación Verbal": "FFFFE6FF",
      "Carrera": "FFFFE6E6",
      "Knockouts - Eliminatorias": "FFF5F5F5",
      "Ceremonia de Clausura y Premios": "FFFFF0B8",
      "Race": "FFFFE6E6",
      "Concurrent Activity": "FFF8F9FA",
      "Global Event": "FFFFF0B8",
    };

    // Data rows with fixed 5-minute slots
    for (const intervalStart of generate5MinSlots(minStart, maxEnd)) {
      const intervalEnd = new Date(intervalStart.getTime() + FIVE_MIN_MS);

      const rowValues: ExcelJS.CellValue[] = [formatTimeRange(intervalStart, intervalEnd)];

      teamsThisDay.forEach(equipo => {
        const evento = equipo.horario
          .filter(ev => ev.nombre !== "Descanso" && ev.start.toDateString() === dayKey)
          .find(ev => intervalStart < ev.end && intervalEnd > ev.start);

        if (evento) {
          const activityText = formatActivityName(evento.nombre, equipo.nombre);
          rowValues.push(activityText);
        } else {
          rowValues.push("");
        }
      });

      const row = ws.addRow(rowValues);
      row.height = 35;

      // Time cell styling
      const timeCell = row.getCell(1);
      timeCell.font = { bold: true, size: 10, color: { argb: "FF2C3E50" } };
      timeCell.alignment = { horizontal: "center", vertical: "middle" };

      // Team cell styling
      teamsThisDay.forEach((equipo, teamIndex) => {
        const colIndex = teamIndex + 2;
        const cell = row.getCell(colIndex);
        const hasText = !!String(cell.value || "");

        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

        if (hasText) {
          const evento = equipo.horario
            .filter(ev => ev.nombre !== "Descanso" && ev.start.toDateString() === dayKey)
            .find(ev => intervalStart < ev.end && intervalEnd > ev.start);

          if (evento) {
            const activityName = getActivityType(evento.nombre, evento.tipo);
            const color = activityColors[activityName] || "FFF8F9FA";

            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
            cell.font = { size: 9, color: { argb: "FF2C3E50" } };
            cell.border = {
              top: { style: "thin", color: { argb: "FFDEE2E6" } },
              bottom: { style: "thin", color: { argb: "FFDEE2E6" } },
              left: { style: "thin", color: { argb: "FFDEE2E6" } },
              right: { style: "thin", color: { argb: "FFDEE2E6" } },
            };
          }
        }
      });
    }

    // Fixed column widths
    ws.getColumn(1).width = 22;  // Time column
    for (let i = 2; i <= teamsThisDay.length + 1; i++) {
      const teamIndex = i - 2;
      if (teamIndex < teamsThisDay.length) {
        const team = teamsThisDay[teamIndex];
        const teamNameLength = `${team.nombre} (${team.categoria})`.length;
        const calculatedWidth = Math.max(25, Math.min(35, teamNameLength + 5));
        ws.getColumn(i).width = calculatedWidth;
      }
    }

    // Freeze panes
    ws.views = [{ state: "frozen", xSplit: 1, ySplit: 3, topLeftCell: "B4" }];

    // Legend
    addSimpleLegend(ws, activityColors, totalCols);

    // Print settings
    ws.pageSetup = {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0, footer: 0 },
    };
  }

  return wb;
}

/**
 * Simple, clean legend
 */
function addSimpleLegend(
  ws: ExcelJS.Worksheet,
  activityColors: Record<string, string>,
  totalCols: number
) {
  const legendTitleRow = ws.addRow(["Leyenda de Actividades"]);
  legendTitleRow.height = 35;

  const legendTitleCell = legendTitleRow.getCell(1);
  legendTitleCell.font = { size: 12, bold: true, color: { argb: "FF2C3E50" } };
  legendTitleCell.alignment = { horizontal: "left", vertical: "middle" };

  try {
    ws.mergeCells(legendTitleRow.number, 1, legendTitleRow.number, totalCols);
  } catch {
    console.warn("Legend title merge failed, using single cell");
  }

  const legendEntries = Object.entries(activityColors);
  legendEntries.forEach(([activity, color]) => {
    const legendRow = ws.addRow([]);
    legendRow.height = 25;

    const colorCell = legendRow.getCell(1);
    colorCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    colorCell.border = {
      top: { style: "thin", color: { argb: "FFDEE2E6" } },
      bottom: { style: "thin", color: { argb: "FFDEE2E6" } },
      left: { style: "thin", color: { argb: "FFDEE2E6" } },
      right: { style: "thin", color: { argb: "FFDEE2E6" } },
    };
    colorCell.alignment = { horizontal: "center", vertical: "middle" };

    const nameCell = legendRow.getCell(2);
    nameCell.value = activity;
    nameCell.font = { size: 10, color: { argb: "FF2C3E50" } };
    nameCell.alignment = { horizontal: "left", vertical: "middle" };
  });
}

/**
 * Keeps the original name/behavior: builds the formatted workbook and downloads it.
 */
export async function generarExcelMaster(equipos: Equipo[]) {
  const wb = await buildMasterGanttWorkbook(equipos);
  await downloadWorkbook(wb, "Horario_Maestro_Gantt.xlsx");
}
