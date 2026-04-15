// generarExcelMaster.ts (5-minute slot rows)
import ExcelJS from "exceljs";
import { Equipo, Evento } from "../../../../types/types";
import { downloadWorkbook, formatDateTime, getDurationInMinutes } from "../excelUtils";
import {
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

/** Activity styles (cells display ONLY the key) */
type ActivityStyle = { label: string; color: string };
const activityStyles: Record<string, ActivityStyle> = {
  R: { label: "Carrera", color: "FFFF0000" },                              // #FF0000
  D: { label: "Diseño e ingeniería", color: "FF9933FF" },                  // #9933FF
  E: { label: "Empresa", color: "FF00B050" },                              // #00B050
  V: { label: "Presentación verbal", color: "FF00B0F0" },                  // #00B0F0
  F: { label: "Descansos", color: "FF8C6312" },                            // #8C6312
  P: { label: "Pit Display", color: "FFFFD966" },                          // #FFD966
  T: { label: "Ceremonia de inauguración & Clausura", color: "FFD0CECE" }, // #D0CECE
  S: { label: "Scrutineering", color: "FF0F0F0F" },                        // #0F0F0F
  A: { label: "Registro", color: "FF000000" },                             // #000000
};
const VALID_CODES = new Set(Object.keys(activityStyles));

// Generic color for unmapped events
const GENERIC_COLOR = "FF9E9E9E"; // Gray color for unknown events

function resolveActivityCode(evento: { nombre: string; tipo?: string }): string | undefined {
  const n = (evento.nombre || "").toLowerCase();
  const t = ((evento as any).tipo || "").toLowerCase();
  const text = `${n} ${t}`.trim();

  // 0) OVERRIDES: reglas que nunca deben fallar
  // Pit Display / stand / montaje → 'P' SIEMPRE (antes que el helper)
  if (/\b(pit[-\s]*display|pitdisplay|pit\b|stand\b|montaje\b)\b/.test(text)) return "P";

  // Breaks / meals
  if (/\b(break|comida|almuerzo|lunch|merienda|coffee|café)\b/.test(text)) return "F";
  if (/\b(descanso)\b/.test(text)) return "NOT";

  // 1) Helper (después de los overrides)
  const fromHelper = (getActivityType(evento.nombre, (evento as any).tipo) || "").toString().trim();
  if (VALID_CODES.has(fromHelper)) return fromHelper;

  // 2) Resto de mapeos por palabras clave

  // Registro
  if (/\b(registro|register|check[- ]?in)\b/.test(text)) return "A";

  // Escrutinio / inspección
  if (/\b(scrutineering|scrutin(e|io)|inspecci[oó]n|escrutinio)\b/.test(text)) return "S";

  // Ceremonias
  if (/\b(charla|ceremonia|inauguraci[oó]n|clausura|premios|awards|opening|closing)\b/.test(text)) return "T";

  // Verbal / charlas (ojo: esto va después de Pit)
  if (/\b(verbal\s*verbal|exposici[oó]n)\b/.test(text) || text === "presentación verbal concurrent activity") return "V";

  // Empresa / marketing
  if (/\b(empresa|business|marketing|portfolio\s*de\s*empresa)\b/.test(text)) return "E";

  // Diseño / ingeniería (técnico)
  if (/\b(dise[nñ]o|ingenier[ií]a|t[eé]cnico|technical|portfolio\s*t[eé]cnico)\b/.test(text)) return "D";

  // Carreras / pista
  if (/\b(carrera|race|knockout|knock-outs|track|pista|heats|qualify|qualifying)\b/.test(text)) return "R";

  // Desconocido
  return undefined;
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
    const headerRow = ["Horario", ...teamsThisDay.map(e => `${e.nombre}`)];
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

    // Data rows with fixed 5-minute slots
    for (const intervalStart of generate5MinSlots(minStart, maxEnd)) {
      const intervalEnd = new Date(intervalStart.getTime() + FIVE_MIN_MS);

      const rowValues: ExcelJS.CellValue[] = [formatTimeRange(intervalStart, intervalEnd)];

      // Fill values now (so style decisions can check value)
      teamsThisDay.forEach(equipo => {
        const evento = equipo.horario
          .filter(ev => ev.start.toDateString() === dayKey)
          .find(ev => intervalStart < ev.end && intervalEnd > ev.start);

        if (!evento) {
          rowValues.push("");
          return;
        }

        const code = resolveActivityCode(evento);

        // Hide breaks
        if (code === "NOT") {
          rowValues.push("");
          return;
        }

        if (code && VALID_CODES.has(code)) {
          // Known key → show the letter only
          rowValues.push(code);
        } else {
          // Unknown → show full title
          rowValues.push(evento.nombre || "");
        }
      });

      const row = ws.addRow(rowValues);
      row.height = 35;

      // Time cell styling
      const timeCell = row.getCell(1);
      timeCell.font = { bold: true, size: 10, color: { argb: "FF2C3E50" } };
      timeCell.alignment = { horizontal: "center", vertical: "middle" };

      // Style team cells
      teamsThisDay.forEach((_, teamIndex) => {
        const colIndex = teamIndex + 2;
        const cell = row.getCell(colIndex);
        const val = (cell.value ?? "").toString();
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

        if (!val) return;

        // If value is exactly a known key, style with its color + white text
        if (VALID_CODES.has(val)) {
          const { color } = activityStyles[val];
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
          cell.font = { size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        } else {
          // Unknowns: full title with generic gray background and dark text
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GENERIC_COLOR } };
          cell.font = { size: 10, bold: true, color: { argb: "FF2C3E50" } };
        }

        // Subtle border for any non-empty cell
        cell.border = {
          top: { style: "thin", color: { argb: "FFDEE2E6" } },
          bottom: { style: "thin", color: { argb: "FFDEE2E6" } },
          left: { style: "thin", color: { argb: "FFDEE2E6" } },
          right: { style: "thin", color: { argb: "FFDEE2E6" } },
        };
      });
    }

    // Fixed column widths
    ws.getColumn(1).width = 22; // Time column
    for (let i = 2; i <= teamsThisDay.length + 1; i++) {
      const teamIndex = i - 2;
      if (teamIndex < teamsThisDay.length) {
        const team = teamsThisDay[teamIndex];
        const teamNameLength = `${team.nombre}`.length;
        const calculatedWidth = Math.max(10, Math.min(35, teamNameLength + 2));
        console.log(calculatedWidth)
        ws.getColumn(i).width = calculatedWidth;
      }
    }

    // Freeze panes
    ws.views = [{ state: "frozen", xSplit: 1, ySplit: 3, topLeftCell: "B4" }];

    // Legend (keys + names; 'F' can stay here even if not rendered in grid)
    addSimpleLegend(ws, activityStyles, totalCols);

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
 * Legend: KEY – Label with the activity color.
 * Also includes a generic entry for unmapped events.
 */
function addSimpleLegend(
  ws: ExcelJS.Worksheet,
  styles: Record<string, { label: string; color: string }>,
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

  const order = ["R", "D", "E", "V", "F", "P", "T", "S", "A"];
  order.forEach(key => {
    const s = styles[key];
    if (!s) return;

    const legendRow = ws.addRow([]);
    legendRow.height = 25;

    const colorCell = legendRow.getCell(1);
    colorCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: s.color } };
    colorCell.border = {
      top: { style: "thin", color: { argb: "FFDEE2E6" } },
      bottom: { style: "thin", color: { argb: "FFDEE2E6" } },
      left: { style: "thin", color: { argb: "FFDEE2E6" } },
      right: { style: "thin", color: { argb: "FFDEE2E6" } },
    };
    colorCell.alignment = { horizontal: "center", vertical: "middle" };

    const nameCell = legendRow.getCell(2);
    nameCell.value = `${key} – ${s.label}`;
    nameCell.font = { size: 10, color: { argb: "FF2C3E50" } };
    nameCell.alignment = { horizontal: "left", vertical: "middle" };
  });

  // Add generic entry for unmapped events
  const genericLegendRow = ws.addRow([]);
  genericLegendRow.height = 25;

  const genericColorCell = genericLegendRow.getCell(1);
  genericColorCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GENERIC_COLOR } };
  genericColorCell.border = {
    top: { style: "thin", color: { argb: "FFDEE2E6" } },
    bottom: { style: "thin", color: { argb: "FFDEE2E6" } },
    left: { style: "thin", color: { argb: "FFDEE2E6" } },
    right: { style: "thin", color: { argb: "FFDEE2E6" } },
  };
  genericColorCell.alignment = { horizontal: "center", vertical: "middle" };

  const genericNameCell = genericLegendRow.getCell(2);
  genericNameCell.value = "Otros – Eventos no categorizados";
  genericNameCell.font = { size: 10, color: { argb: "FF2C3E50" } };
  genericNameCell.alignment = { horizontal: "left", vertical: "middle" };
}

/**
 * Keeps the original name/behavior: builds the formatted workbook and downloads it.
 */
export async function generarExcelMaster(equipos: Equipo[]) {
  const wb = await buildMasterGanttWorkbook(equipos);
  await downloadWorkbook(wb, "Horario_Maestro_Gantt.xlsx");
}

export async function generarExcelMasteTabla(equipos: Equipo[]) {
  const wb = await buildMasterTableWorkbook(equipos);
  await downloadWorkbook(wb, "Horario_Maestro_Tabla.xlsx")
}

export type MasterTableOptions = {
  /** Column widths by 1-based column index (e.g., {1: 30} sets col A width to 30) */
  columnWidths?: Record<number, number>;
  /** Default body row height (header height is managed separately) */
  rowHeight?: number;
  /** Header height */
  headerHeight?: number;
  /** Enable zebra striping */
  zebra?: boolean;
  /** Header fill ARGB (default light slate) */
  headerFill?: string;
  /** Header font color ARGB (default white) */
  headerFontColor?: string;
  /** Body fill for odd rows ARGB */
  bodyOddFill?: string;
  /** Body fill for even rows ARGB */
  bodyEvenFill?: string;
  /** Border color ARGB */
  borderColor?: string;
  /** Add a big title row on top (merged) */
  title?: string;
  /** Title font color ARGB */
  titleFontColor?: string;
  /** Title height */
  titleHeight?: number;
};

const DEFAULTS: Required<Omit<MasterTableOptions,
  "columnWidths" | "title">> & Pick<MasterTableOptions, "columnWidths" | "title"> = {
  columnWidths: undefined,
  rowHeight: 22,
  headerHeight: 26,
  zebra: true,
  headerFill: "FF2C3E50",      // slate
  headerFontColor: "FFFFFFFF",  // white
  bodyOddFill: "FFFFFFFF",      // white
  bodyEvenFill: "FFF8F9FA",     // very light gray
  borderColor: "FFDEE2E6",      // subtle gray
  title: undefined,
  titleFontColor: "FF2C3E50",
  titleHeight: 34,
};

/**
 * Builds (but does not download) the grouped-by-event workbook with pleasant styling.
 * Rows are unique by (ev.nombre, start, end); "Participantes" lists all equipos sharing that slot.
 */
export async function buildMasterTableWorkbook(
  equipos: Equipo[],
  options?: MasterTableOptions
): Promise<ExcelJS.Workbook> {
  const cfg = { ...DEFAULTS, ...options };

  const wb = new ExcelJS.Workbook();
  wb.creator = "Tournament Scheduler";
  wb.created = new Date();
  wb.subject = "Master Tournament Schedule (Grouped Events)";

  const ws = wb.addWorksheet("Horario Maestro");

  // Optional Title
  if (cfg.title) {
    const titleRow = ws.addRow([cfg.title]);
    titleRow.height = cfg.titleHeight;
    const c = titleRow.getCell(1);
    c.font = { bold: true, size: 16, color: { argb: cfg.titleFontColor } };
    c.alignment = { horizontal: "left", vertical: "middle" };
    // merge across the table width (we know we’ll have 5 columns)
    ws.mergeCells(titleRow.number, 1, titleRow.number, 5);
    ws.addRow([]); // spacer
  }

  // Header
  const headers = ["Actividad", "Duración (min)", "Inicio", "Fin", "Participantes"];
  ws.addRow(headers);

  // Style header
  const headerRowIdx = ws.lastRow!.number;
  const headerRow = ws.getRow(headerRowIdx);
  headerRow.height = cfg.headerHeight;
  headerRow.font = { bold: true, color: { argb: cfg.headerFontColor } };
  headerRow.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: cfg.headerFill } };
    cell.border = {
      top: { style: "medium", color: { argb: cfg.borderColor } },
      left: { style: "thin", color: { argb: cfg.borderColor } },
      bottom: { style: "thin", color: { argb: cfg.borderColor } },
      right: { style: "thin", color: { argb: cfg.borderColor } },
    };
  });

  // Collect groups
  type GroupValue = {
    actividad: string;
    duracionMin: number;
    inicio: Date;
    fin: Date;
    participantes: Set<string>;
  };
  const groups = new Map<string, GroupValue>();

  equipos.forEach((equipo) => {
    (equipo.horario as Evento[])
      .filter((ev) => ev.nombre !== "Descanso")
      .forEach((ev) => {
        const key = `${ev.nombre}__${ev.start.getTime()}__${ev.end.getTime()}`;
        if (!groups.has(key)) {
          groups.set(key, {
            actividad: ev.nombre,
            duracionMin: getDurationInMinutes(ev),
            inicio: ev.start,
            fin: ev.end,
            participantes: new Set<string>(),
          });
        }
        groups.get(key)!.participantes.add(equipo.nombre);
      });
  });

  // Sorted rows
  const rows = Array.from(groups.values()).sort((a, b) => {
    const t = a.inicio.getTime() - b.inicio.getTime();
    return t !== 0 ? t : a.actividad.localeCompare(b.actividad);
  });

  // Body rows
  rows.forEach((g, idx) => {
    const participantes = Array.from(g.participantes).sort((a, b) => a.localeCompare(b)).join(", ");
    const row = ws.addRow([
      g.actividad,
      g.duracionMin,
      formatDateTime(g.inicio),
      formatDateTime(g.fin),
      participantes,
    ]);

    row.height = cfg.rowHeight;

    // Zebra striping (skip header)
    const isEven = (idx % 2) === 1; // 0-based within body
    const fillColor = cfg.zebra ? (isEven ? cfg.bodyEvenFill : cfg.bodyOddFill) : undefined;

    row.eachCell((cell, colNumber) => {
      if (fillColor) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fillColor } };
      }
      cell.border = {
        top: { style: "thin", color: { argb: cfg.borderColor } },
        left: { style: "thin", color: { argb: cfg.borderColor } },
        bottom: { style: "thin", color: { argb: cfg.borderColor } },
        right: { style: "thin", color: { argb: cfg.borderColor } },
      };

      // Alignments by column
      if (colNumber === 1) cell.alignment = { vertical: "middle", wrapText: true };                // Actividad
      if (colNumber === 2) cell.alignment = { vertical: "middle", horizontal: "center" };          // Duración
      if (colNumber === 3 || colNumber === 4) cell.alignment = { vertical: "middle" };             // Inicio/Fin
      if (colNumber === 5) cell.alignment = { vertical: "middle", wrapText: true };                // Participantes
    });
  });

  // AutoFilter
  const firstDataRow = headerRowIdx;
  const lastRow = ws.lastRow?.number ?? headerRowIdx;
  ws.autoFilter = {
    from: { row: firstDataRow, column: 1 },
    to: { row: lastRow, column: headers.length },
  };

  // Column widths
  if (cfg.columnWidths) {
    Object.entries(cfg.columnWidths).forEach(([colIdxStr, width]) => {
      const colIdx = Number(colIdxStr);
      if (Number.isFinite(colIdx) && width && width > 0) ws.getColumn(colIdx).width = width;
    });
  } else {
    // Safe auto-width (with clamp)
    ws.columns.forEach((col) => {
      const max = (col.values || []).reduce((acc: number, v: unknown) => {
        const len = (v ?? "").toString().length;
        return Math.max(acc, len);
      }, 0);
      col.width = Math.max(15, Math.min(60, max + 2));
    });
  }

  // Freeze header (and the optional title+spacer if present)
  const ySplit = cfg.title ? 3 : 1; // title + spacer + header vs. just header
  ws.views = [{ state: "frozen", xSplit: 0, ySplit }];

  // Print settings
  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    margins: { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
  };

  return wb;
}