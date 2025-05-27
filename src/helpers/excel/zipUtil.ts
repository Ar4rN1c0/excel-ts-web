import JSZip from "jszip";
import ExcelJS from "exceljs";
import { Equipo, Juez } from "../../types/types";
import { formatActivityName, formatDateTime, getDurationInMinutes } from "./output";

export async function generateZip(teams: Equipo[], judges: Juez[]) {
    const zip = new JSZip();

    // --- Master Excel ---
    {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Horario Maestro');
        ws.addRow(['Equipo', 'Categoría', 'Actividad', 'Duración (min)', 'Inicio', 'Fin']);
        ws.getRow(1).font = { bold: true };

        teams.forEach(equipo => {
            equipo.horario
                .filter(ev => ev.nombre !== "Descanso")
                .sort((a, b) => a.start.getTime() - b.start.getTime())
                .forEach(ev => {
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

        // Set column widths
        ws.columns.forEach(column => {
            const values = column.values?.slice(1) ?? [];
            const maxLength = values.reduce<number>((max, value) => {
                const str = value != null ? value.toString() : "";
                return Math.max(max, str.length);
            }, 0);
            column.width = Math.max(15, maxLength);
        });

        const buf = await wb.xlsx.writeBuffer();
        zip.file('Horario_Maestro.xlsx', buf);
    }

    // --- Team Excels ---
    for (const equipo of teams) {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Horario');
        ws.addRow(['Actividad', 'Duración (min)', 'Inicio', 'Fin']);
        ws.getRow(1).font = { bold: true };

        equipo.horario
            .filter(ev => ev.nombre !== "Descanso")
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .forEach(ev => {
                ws.addRow([
                    formatActivityName(ev.nombre, equipo.nombre),
                    getDurationInMinutes(ev),
                    formatDateTime(ev.start),
                    formatDateTime(ev.end)
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

    // --- Judge Excels ---
    for (const juez of judges) {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Horario');
        ws.addRow(['Actividad', 'Duración (min)', 'Inicio', 'Fin']);
        ws.getRow(1).font = { bold: true };

        juez.horario
            .sort((a, b) => a.start.getTime() - b.start.getTime())
            .forEach(ev => {
                ws.addRow([
                    formatActivityName(ev.nombre, ''),
                    getDurationInMinutes(ev),
                    formatDateTime(ev.start),
                    formatDateTime(ev.end)
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
        zip.file(`Juez_${juez.tipo}_${juez.id}_Horario.xlsx`, buf);
    }

    // --- Generate ZIP and trigger download ---
    const content = await zip.generateAsync({ type: "blob" });

    // Safe download trigger for most browsers
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = "Horarios.zip";
    document.body.appendChild(a); // Fix for Firefox
    a.click();
    setTimeout(() => {
        URL.revokeObjectURL(a.href);
        document.body.removeChild(a);
    }, 2000);
}
