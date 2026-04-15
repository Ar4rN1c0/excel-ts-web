import JSZip from "jszip";
import { Assignation, Equipo, Juez } from "../../../types/types";
import { buildMasterGanttWorkbook, buildMasterTableWorkbook } from "../excel/files/masterExcel";
import { buildJuezWorkbook } from "../excel/files/judgeExcel";
import { buildEquipoWorkbook } from "../excel/files/teamsExcel";



export async function generateZip(
  teams: Equipo[],
  judges: Juez[],
  assignations: Assignation[]
) {
  const zip = new JSZip();

  // --- Master Gantt ---
  {
    const wb = await buildMasterGanttWorkbook(teams);
    const buf = await wb.xlsx.writeBuffer();
    zip.file("Horario_Maestro_Gantt.xlsx", buf);
  }
  // --- Master Table ---
  {
    const wb = await buildMasterTableWorkbook(teams);
    const buf = await wb.xlsx.writeBuffer();
    zip.file("Horario_Maestro_Tabla.xlsx", buf)
  }

  // --- Team Excels (simple per-team schedules; keep as-is) ---
  for (const equipo of teams) {
    const wb = await buildEquipoWorkbook(equipo, assignations);
    const buf = await wb.xlsx.writeBuffer();
    zip.file(`Equipo_${sanitizeFileName(equipo.nombre)}_Horario.xlsx`, buf);
  }
  // --- Judge Excels (formatted via builder) ---
  for (const juez of judges) {
    const wb = await buildJuezWorkbook(juez, assignations);
    const buf = await wb.xlsx.writeBuffer();
    // keep or swap nombre/id per your preference
    zip.file(`Juez_${juez.nombre}_Horario.xlsx`, buf);
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


function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}