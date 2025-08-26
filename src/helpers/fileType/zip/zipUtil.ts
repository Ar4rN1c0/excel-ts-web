import JSZip from "jszip";
import ExcelJS from "exceljs";
import { Assignation, Equipo, Juez } from "../../../types/types";
import { formatActivityName } from "../excel/output_utils";
import { formatDateTime, getDurationInMinutes } from "../excel/excelUtils";
import { buildMasterGanttWorkbook } from "../excel/files/masterExcel";
import { buildJuezWorkbook } from "../excel/files/judgeExcel";



export async function generateZip(
  teams: Equipo[],
  judges: Juez[],
  assignations: Assignation[]
) {
  const zip = new JSZip();

  // --- Master Gantt (formatted) ---
  {
    const wb = await buildMasterGanttWorkbook(teams);
    const buf = await wb.xlsx.writeBuffer();
    zip.file("Horario_Maestro_Gantt.xlsx", buf);
  }

  // --- Team Excels (simple per-team schedules; keep as-is) ---
  for (const equipo of teams) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Horario");
    ws.addRow(["Actividad", "Duración (min)", "Inicio", "Fin"]);
    ws.getRow(1).font = { bold: true };

    equipo.horario
      .filter(ev => ev.nombre !== "Descanso")
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .forEach(ev => {
        ws.addRow([
          formatActivityName(ev.nombre, equipo.nombre),
          getDurationInMinutes(ev),
          formatDateTime(ev.start),
          formatDateTime(ev.end),
        ]);
      });

    ws.columns.forEach(column => {
      const values = column.values?.slice(1) ?? [];
      const maxLength = values.reduce<number>((max, value) => {
        const str = value != null ? value.toString() : "";
        return Math.max(max, str.length);
      }, 0);
      column.width = Math.max(15, maxLength);
    });

    const buf = await wb.xlsx.writeBuffer();
    zip.file(`Equipo_${equipo.nombre}_Horario.xlsx`, buf);
  }

  // --- Judge Excels (formatted via builder) ---
  for (const juez of judges) {
    const wb = await buildJuezWorkbook(juez, assignations);
    const buf = await wb.xlsx.writeBuffer();
    // keep or swap nombre/id per your preference
    zip.file(`Juez_${juez.tipo}_${juez.nombre}_Horario.xlsx`, buf);
  }

  // --- Generate ZIP and trigger download ---
  const content = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(content);
  a.download = "Horarios.zip";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
  }, 2000);
}
