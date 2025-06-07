import JSZip from "jszip";
import ExcelJS from "exceljs";
import { Assignation, Equipo, Juez } from "../../../types/types";
import { formatActivityName, formatDateTime, getDurationInMinutes } from "../excel/output";

export async function generateZip(teams: Equipo[], judges: Juez[], assignations: Assignation[]) {
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

        ws.addRow(['Actividad', 'Duración (min)', 'Inicio', 'Fin', 'Participante']);
        ws.getRow(1).font = { bold: true };
        console.log(assignations.filter(a => a.judge.id === juez.id)
            .sort((a, b) => new Date(a.event.start).getTime() - new Date(b.event.start).getTime())
            .map(a => `Judge ${a.judge.nombre} is assigned ${a.event.nombre} for team ${a.team} from ${formatDateTime(a.event.start)} to ${formatDateTime(a.event.end)}`)
        )

        // Filter assignments for this judge, sort by event.start
        const rows = assignations
            .filter(a => a.judge.id === juez.id)
            .sort((a, b) => new Date(a.event.start).getTime() - new Date(b.event.start).getTime())
            .map(a => [
                a.event.nombre,
                a.event.duracion,
                formatDateTime(a.event.start),
                formatDateTime(a.event.end),
                a.team
            ]);

        rows.forEach(row => ws.addRow(row));

        // Auto-size columns (optional, keep if you want)
        ws.columns.forEach(column => {
            const values = column.values?.slice(1) ?? [];
            const maxLength = values.reduce<number>((max, value) => {
                const str = value != null ? value.toString() : "";
                return Math.max(max, str.length);
            }, 0);
            column.width = Math.max(15, maxLength);
        });

        const buf = await wb.xlsx.writeBuffer();
        zip.file(`Juez_${juez.tipo}_${juez.nombre}_Horario.xlsx`, buf);
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
