// src/output.ts
import { Equipo } from './excel';
import { Juez }   from './timetable';
import ExcelJS    from 'exceljs';

function fmtTime(d: Date): string {
  return d.getHours().toString().padStart(2,'0') + ':' +
         d.getMinutes().toString().padStart(2,'0');
}

export async function generarExcelEquipo(e: Equipo) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Horario');
  ws.addRow(['Actividad','Duración (min)','Inicio','Fin']);
  e.horario.forEach(ev =>
    ws.addRow([ev.nombre, ev.duracion, fmtTime(ev.inicio), fmtTime(ev.fin)])
  );
  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `Equipo_${e.nombre}_Horario.xlsx`;
  a.click();
}

export async function generarExcelMaster(eqs: Equipo[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Horario Maestro');
  ws.addRow(['Equipo','Actividad','Duración (min)','Inicio','Fin']);
  // Solo Development + Professional
  eqs
    .filter(eq => eq.categoria !== 'Entry')
    .forEach(eq =>
      eq.horario.forEach(ev =>
        ws.addRow([eq.nombre, ev.nombre, ev.duracion, fmtTime(ev.inicio), fmtTime(ev.fin)])
      )
    );
  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'Horario_Maestro.xlsx';
  a.click();
}

export async function generarExcelMasterJueces(jues: Juez[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Horario Jueces');
  ws.addRow(['Juez','Tipo','Actividad','Duración (min)','Inicio','Fin']);
  jues.forEach(j =>
    j.horario.forEach(ev =>
      ws.addRow([`Juez ${j.tipo} ${j.id}`, j.tipo, ev.nombre, ev.duracion, fmtTime(ev.inicio), fmtTime(ev.fin)])
    )
  );
  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'Horario_Jueces_Maestro.xlsx';
  a.click();
}
