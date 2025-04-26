// output.ts

import ExcelJS from 'exceljs';
import { Equipo, Juez } from './timetable';

export async function generarExcelEquipo(equipo: Equipo) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Horario');
  ws.addRow(['Actividad','Duración (min)','Inicio','Fin']);
  equipo.horario.forEach(ev =>
    ws.addRow([
      ev.nombre,
      ev.duracion,
      ev.inicio?.toLocaleString() ?? '',
      ev.fin?.toLocaleString()     ?? ''
    ])
  );
  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `Equipo_${equipo.nombre}_Horario.xlsx`;
  a.click();
}

export async function generarExcelMaster(equipos: Equipo[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Horario Maestro');
  ws.addRow(['Equipo','Actividad','Duración (min)','Inicio','Fin']);
  equipos.forEach(eq =>
    eq.horario.forEach(ev =>
      ws.addRow([
        eq.nombre,
        ev.nombre,
        ev.duracion,
        ev.inicio?.toLocaleString() ?? '',
        ev.fin?.toLocaleString()     ?? ''
      ])
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

export async function generarExcelMasterJueces(jueces: Juez[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Horario Jueces Maestro');
  ws.addRow(['Juez','Tipo','Actividad','Duración (min)','Inicio','Fin']);
  jueces.forEach(j =>
    j.horario.forEach(ev =>
      ws.addRow([
        `Juez ${j.tipo} ${j.id}`,
        j.tipo,
        ev.nombre,
        ev.duracion,
        ev.inicio?.toLocaleString() ?? '',
        ev.fin?.toLocaleString()     ?? ''
      ])
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

export async function generarExcelJuez(juez: Juez) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Horario Juez');
  ws.addRow(['Actividad','Duración (min)','Inicio','Fin']);
  juez.horario.forEach(ev =>
    ws.addRow([
      ev.nombre,
      ev.duracion,
      ev.inicio?.toLocaleString() ?? '',
      ev.fin?.toLocaleString()     ?? ''
    ])
  );
  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `Juez_${juez.tipo}_${juez.id}_Horario.xlsx`;
  a.click();
}
