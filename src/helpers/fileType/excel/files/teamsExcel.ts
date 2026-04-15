// generarExcelEquipo.ts (same path/file where your original lived)
import ExcelJS from "exceljs";
import { Assignation, Equipo, Evento, Juez } from "../../../../types/types";
import { formatActivityName } from "../output_utils";
import { downloadWorkbook, formatDateTime, getDurationInMinutes } from "../excelUtils";

/**
 * Build (but do not download) the formatted team workbook.
 */
export async function buildEquipoWorkbook(equipo: Equipo, assignations: Assignation[]): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Horario", {
    views: [{ state: "frozen", ySplit: 8 }], // congela hasta la cabecera
  });

  // Configuración de página y pie de página
  ws.pageSetup = {
    paperSize: 9, // A4
    orientation: "portrait",
    fitToPage: true,
    fitToHeight: 1,
    fitToWidth: 1,
    margins: { left: 0.5, right: 0.5, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
  };
  ws.headerFooter = {
    oddFooter: `&L&8Equipo: &B&K000000${equipo.nombre}&R&P de &N`,
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
  const items = equipo.horario
    .filter((ev: Evento) => ev.nombre !== "Descanso" && ev.nombre !== "Knockouts - Eliminatorias")
    .sort((a: Evento, b: Evento) => a.start.getTime() - b.start.getTime());

  const totalMin = items.reduce((acc, ev) => acc + getDurationInMinutes(ev), 0);
  const totalActiv = items.length;
  const firstStart = items[0]?.start;
  const lastEnd = items[items.length - 1]?.end;

  // ===== 2) título y metainfo =====
  ws.mergeCells("A1:E1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "Horario de Equipo";
  titleCell.font = { bold: true, size: 16 };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };

  ws.mergeCells("A2:E2");
  const nameCell = ws.getCell("A2");
  nameCell.value = equipo.nombre;
  nameCell.font = { size: 12 };
  nameCell.alignment = { vertical: "middle", horizontal: "left" };

  ws.getCell("A3").value = "ID";
  ws.getCell("B3").value = String(equipo.id);
  ws.getCell("A4").value = "Categoría";
  ws.getCell("B4").value = String(equipo.categoria);
  ws.getCell("A5").value = "Actividades";
  ws.getCell("B5").value = totalActiv;
  ws.getCell("A6").value = "Total minutos";
  ws.getCell("B6").value = totalMin;

  ws.getCell("C3").value = "Primer inicio";
  ws.getCell("D3").value = firstStart ? formatDateTime(firstStart) : "-";
  ws.getCell("C4").value = "Último fin";
  ws.getCell("D4").value = lastEnd ? formatDateTime(lastEnd) : "-";

  ["A3", "A4", "A5", "A6", "C3", "C4"].forEach(addr => {
    const c = ws.getCell(addr);
    c.font = metaLabelFont;
    c.alignment = { horizontal: "left" };
  });

  // Banda separadora (fila 7)
  ws.mergeCells("A7:E7");
  const sep = ws.getCell("A7");
  sep.value = "";
  sep.fill = metaBandFill;

  // ===== 3) cabecera de la tabla (fila 8) =====
  const headerRowNumber = 8;
  const headerRow = ws.getRow(headerRowNumber);
  //       1            2        3               4        5
  headerRow.values = ["Actividad", "Juez", "Duración (min)", "Inicio", "Fin"];
  headerRow.eachCell(c => {
    c.font = headerFont;
    c.fill = headerFill;
    c.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    c.border = borderThin;
  });
  headerRow.height = 20;

  // ===== 4) filas de datos =====
  let r = headerRowNumber + 1;
  items.forEach((ev: Evento, idx: number) => {
    const juez = findJudgeForEvent(ev, equipo, assignations);
    const row = ws.getRow(r);
    row.values = [
      formatActivityName(ev.nombre, equipo.nombre), // A
      juez ? juez.nombre : "-",                     // B
      getDurationInMinutes(ev),                     // C
      formatDateTime(ev.start),                     // D
      formatDateTime(ev.end),                       // E
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
  // Duración ahora está en la columna C
  totalRow.values = ["Total", "", { formula: `SUM(C${headerRowNumber + 1}:C${r - 1})` }, "", ""];
  totalRow.getCell(1).font = { bold: true };
  totalRow.getCell(3).font = { bold: true };
  totalRow.eachCell(c => {
    c.border = borderThin;
  });

  // ===== 6) auto-ajustar ancho de columnas =====
  autoFitColumns(ws);

  // Afinar algunas columnas
  const actividadCol = ws.getColumn(1);
  actividadCol.width = Math.max(actividadCol.width ?? 20, 32);

  ws.getColumn(2).width = Math.max(ws.getColumn(2).width ?? 14, 18); // Juez
  ws.getColumn(3).alignment = { horizontal: "center", vertical: "middle" }; // Duración
  ws.getColumn(4).alignment = { horizontal: "left", vertical: "middle" };   // Inicio
  ws.getColumn(5).alignment = { horizontal: "left", vertical: "middle" };   // Fin

  return wb;
}

/**
 * Keeps the original name/behavior: builds the formatted workbook and downloads it.
 */
export async function generarExcelEquipo(equipo: Equipo, assignations: Assignation[]) {
  const wb = await buildEquipoWorkbook(equipo, assignations);
  await downloadWorkbook(wb, `Equipo_${sanitizeFileName(equipo.nombre)}_Horario.xlsx`);
}

/**
 * Encuentra el juez asociado a un evento del equipo usando assignations[].
 * Sin solapes: se busca por nombre de equipo y coincidencia EXACTA de evento.
 */
function findJudgeForEvent(ev: Evento, equipo: Equipo, assignations: Assignation[]): Juez | undefined {
  const list = assignations.filter(a => a.team === equipo.nombre);
  const exact = list.find(a => sameEvent(ev, a.event));
  console.log(exact)
  return exact?.judge;
}

function sameEvent(a: Evento, b: Evento): boolean {
  return a.nombre === b.nombre &&
         a.start.getTime() === b.start.getTime() &&
         a.end.getTime() === b.end.getTime();
}

/**
 * Auto-fit de columnas basado en longitud visible (sin soporte nativo en ExcelJS).
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
      } else if (typeof v === "object" && "formula" in v) {
        text = ""; // fórmulas no aportan longitud útil
      } else {
        text = String(v);
      }

      const longest = Math.max(...text.split(/\r?\n/).map(s => s.length));
      if (longest > maxLen) maxLen = longest;
    });

    col.width = Math.min(Math.max(maxLen + 2, min), max);
  }
}

/** Sanea el nombre de archivo evitando caracteres problemáticos */
function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}
