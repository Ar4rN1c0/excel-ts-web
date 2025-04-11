// output.ts

import ExcelJS from 'exceljs';
import { Equipo, Juez } from './timetable';

export async function generarExcelEquipo(equipo: Equipo) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Horario');

  // Encabezados de la tabla
  worksheet.addRow(['Actividad', 'Duración (min)', 'Inicio', 'Fin']);
  equipo.horario.forEach(evento => {
    worksheet.addRow([
      evento.nombre,
      evento.duracion,
      evento.inicio ? evento.inicio.toLocaleTimeString() : '',
      evento.fin ? evento.fin.toLocaleTimeString() : ''
    ]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob(
    [buffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  );
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Equipo_${equipo.nombre}_Horario.xlsx`;
  a.click();
}

export async function generarExcelMaster(equipos: Equipo[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Horario Maestro');

  // Agregar encabezados
  worksheet.addRow(['Equipo', 'Actividad', 'Duración (min)', 'Inicio', 'Fin']);
  equipos.forEach(equipo => {
    equipo.horario.forEach(evento => {
      worksheet.addRow([
        equipo.nombre,
        evento.nombre,
        evento.duracion,
        evento.inicio ? evento.inicio.toLocaleTimeString() : '',
        evento.fin ? evento.fin.toLocaleTimeString() : ''
      ]);
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob(
    [buffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  );
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Horario_Maestro.xlsx';
  a.click();
}

export async function generarExcelJuez(juez: Juez) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Horario Juez');

  // Encabezados
  worksheet.addRow(['Actividad', 'Duración (min)', 'Inicio', 'Fin']);
  juez.horario.forEach(evento => {
    worksheet.addRow([
      evento.nombre,
      evento.duracion,
      evento.inicio ? evento.inicio.toLocaleTimeString() : '',
      evento.fin ? evento.fin.toLocaleTimeString() : ''
    ]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob(
    [buffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  );
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Juez_${juez.tipo}_${juez.id}_Horario.xlsx`;
  a.click();
}

export async function generarExcelMasterJueces(jueces: Juez[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Horario Jueces');

  // Agregar encabezado para el consolidado
  worksheet.addRow(['Juez', 'Tipo', 'Actividad', 'Duración (min)', 'Inicio', 'Fin']);
  jueces.forEach(juez => {
    juez.horario.forEach(evento => {
      worksheet.addRow([
        `Juez ${juez.tipo} ${juez.id}`,
        juez.tipo,
        evento.nombre,
        evento.duracion,
        evento.inicio ? evento.inicio.toLocaleTimeString() : '',
        evento.fin ? evento.fin.toLocaleTimeString() : ''
      ]);
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob(
    [buffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
  );
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Horario_Jueces_Maestro.xlsx';
  a.click();
}
