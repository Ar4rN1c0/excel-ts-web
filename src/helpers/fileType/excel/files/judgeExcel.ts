// generarExcelJuez.ts (same file where the original lived)
import ExcelJS from "exceljs";
import { Assignation, Juez } from "../../../../types/types";
import { downloadWorkbook, formatDateTime } from "../excelUtils";

/**
 * Build (but do not download) the formatted Judge workbook.
 * You can writeBuffer() it for zips, or pass to downloadWorkbook() elsewhere.
 */
export async function buildJuezWorkbook(
  juez: Juez,
  assignations: Assignation[]
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();

  const ws = wb.addWorksheet("Horario", {
    views: [{ state: "frozen", ySplit: 8 }], // congela hasta la fila del header
  });

  // Configuración de página y pie de página (establecidas tras crear la hoja)
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: "portrait",
    fitToPage: true,
    fitToHeight: 1,
    fitToWidth: 1,
    margins: { left: 0.5, right: 0.5, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
  };
  ws.headerFooter = {
    oddFooter: `&L&8Juez: &B&K000000${juez.nombre}&R&P de &N`,
  };

  // ===== estilos base =====
  const solidFill = (argb: string): ExcelJS.FillPattern => ({
    type: "pattern",
    pattern: "solid",
    fgColor: { argb },
  });

  const headerFill = solidFill("FF1F4E79"); // azul
  const metaBandFill = solidFill("FFE9EEF3");
  const zebraFill = solidFill("FFF7FAFC");

  const headerFont: ExcelJS.Font = {
    color: { argb: "FFFFFFFF" }, bold: true,
    name: "",
    size: 0,
    family: 0,
    scheme: "none",
    charset: 0,
    italic: false,
    underline: false,
    vertAlign: "superscript",
    strike: false,
    outline: false
  };
  const metaLabelFont: ExcelJS.Font = {
    bold: true,
    name: "",
    size: 0,
    family: 0,
    scheme: "none",
    charset: 0,
    color: {},
    italic: false,
    underline: false,
    vertAlign: "superscript",
    strike: false,
    outline: false
  };

  const thin: ExcelJS.Border = {
    style: "thin",
    color: {}
  };
  const borderThin: ExcelJS.Borders = {
    top: thin, left: thin, bottom: thin, right: thin,
    diagonal: {}
  };

  // ===== 1) datos y métricas =====
  const items = assignations
    .filter(a => a.judge.id === juez.id)
    .sort((a, b) => new Date(a.event.start).getTime() - new Date(b.event.start).getTime());

  const totalMin = items.reduce((acc, a) => acc + (a.event.duracion || 0), 0);
  const totalActiv = items.length;
  const firstStart = items[0]?.event.start;
  const lastEnd = items[items.length - 1]?.event.end;

  // ===== 2) título y metainfo =====
  ws.mergeCells("A1:E1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "Horario de Juez";
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };

  ws.mergeCells("A2:E2");
  const nameCell = ws.getCell("A2");
  nameCell.value = juez.nombre ?? `${juez.tipo} ${juez.id}`;
  nameCell.font = { size: 12 };
  nameCell.alignment = { vertical: "middle", horizontal: "left" };

  ws.getCell("A3").value = "ID";
  ws.getCell("B3").value = juez.id;
  ws.getCell("A4").value = "Tipo";
  ws.getCell("B4").value = String(juez.tipo);
  ws.getCell("A5").value = "Actividades";
  ws.getCell("B5").value = totalActiv;
  ws.getCell("A6").value = "Total minutos";
  ws.getCell("B6").value = totalMin;

  ws.getCell("D3").value = "Primer inicio";
  ws.getCell("E3").value = firstStart ? formatDateTime(firstStart) : "-";
  ws.getCell("D4").value = "Último fin";
  ws.getCell("E4").value = lastEnd ? formatDateTime(lastEnd) : "-";

  ["A3", "A4", "A5", "A6", "D3", "D4"].forEach(addr => {
    const c = ws.getCell(addr);
    c.font = metaLabelFont;
    c.alignment = { horizontal: "left" };
  });

  // Banda separadora (fila 7)
  ws.mergeCells("A7:E7");
  ws.getCell("A7").fill = metaBandFill;

  // ===== 3) cabecera de la tabla (fila 8) =====
  const headerRowNumber = 8;
  const headerRow = ws.getRow(headerRowNumber);
  headerRow.values = ["Actividad", "Duración (min)", "Inicio", "Fin", "Participante"];
  headerRow.eachCell(c => {
    c.font = headerFont;
    c.fill = headerFill;
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = borderThin;
  });
  headerRow.height = 20;

  // ===== 4) filas de datos =====
  let r = headerRowNumber + 1;
  items.forEach((a, idx) => {
    const row = ws.getRow(r);
    row.values = [
      a.event.nombre,
      a.event.duracion,
      formatDateTime(a.event.start),
      formatDateTime(a.event.end),
      a.team,
    ];

    if (idx % 2 === 0) {
      row.eachCell(c => {
        c.fill = zebraFill;
      });
    }

    row.eachCell(c => {
      c.border = borderThin;
      c.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    });

    r++;
  });

  // ===== 5) fila de total =====
  const totalRow = ws.getRow(r);
  totalRow.values = ["Total", { formula: `SUM(B${headerRowNumber + 1}:B${r - 1})` }, "", "", ""];
  totalRow.getCell(1).font = { bold: true };
  totalRow.getCell(2).font = { bold: true };
  totalRow.eachCell(c => {
    c.border = borderThin;
  });

  // ===== 6) auto-ajustar ancho de columnas =====
  autoFitColumns(ws);

  // Afinar algunas columnas
  const actividadCol = ws.getColumn(1);
  actividadCol.width = Math.max(actividadCol.width ?? 20, 28);
  ws.getColumn(2).alignment = { horizontal: "center", vertical: "middle" };

  return wb;
}

/**
 * Keeps the original name/behavior: builds the formatted Excel and downloads it.
 */
export async function generarExcelJuez(
  juez: Juez,
  assignations: Assignation[]
) {
  const wb = await buildJuezWorkbook(juez, assignations);
  await downloadWorkbook(wb, `Juez_${juez.nombre}_Horario.xlsx`);
}

/**
 * Calcula anchos aproximados según longitud máxima visible de cada columna.
 */
function autoFitColumns(ws: ExcelJS.Worksheet, min = 10, max = 50): void {
  const colCount = ws.columnCount;
  for (let i = 1; i <= colCount; i++) {
    const col = ws.getColumn(i);
    let maxLen = 0;

    col.eachCell({ includeEmpty: true }, cell => {
      const v = cell.value as any;
      let text = "";

      if (v == null) text = "";
      else if (typeof v === "string") text = v;
      else if (typeof v === "number") text = String(v);
      else if (v instanceof Date) text = v.toLocaleString();
      else if (typeof v === "object" && "richText" in v) {
        text = (v.richText as Array<{ text: string }>).map(p => p.text).join("");
      } else {
        text = String(v);
      }

      const lines = text.split(/\r?\n/);
      const longest = Math.max(...lines.map(s => s.length));
      if (longest > maxLen) maxLen = longest;
    });

    col.width = Math.min(Math.max(maxLen + 2, min), max);
  }
}
