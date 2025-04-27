// src/main.ts
import './style.css';
import * as XLSX from 'xlsx';
import { processInputData } from './excel';
import {
  generarExcelEquipo,
  generarExcelMaster,
  generarExcelMasterJueces,
  generarExcelJuez
} from './output';
import { Equipo, asignarHorarios, asignarHorariosJueces, Juez } from './timetable';
import { generateHorarioHtml } from './html';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const appDiv    = document.getElementById('app')!;

  fileInput.addEventListener('change', () => {
    if (!fileInput.files?.length) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      // Leer workbook
      const data     = new Uint8Array(e.target!.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });

      // Obtener hojas necesarias
      const confS = workbook.Sheets['Configuración'];
      const eqS   = workbook.Sheets['Equipos'];
      if (!confS || !eqS) {
        appDiv.innerHTML = "El Excel debe tener hojas 'Configuración' y 'Equipos'";
        return;
      }

      // Convertir a arrays
      const cfgArr = XLSX.utils.sheet_to_json(confS, { header: 1, cellDates: true } as any) as any[][];
      const eqArr  = XLSX.utils.sheet_to_json(eqS,   { header: 1, cellDates: true } as any) as any[][];

      // Procesar datos de entrada
      const { config, equipos } = processInputData(cfgArr, eqArr) as {
        config: any,
        equipos: Equipo[]
      };

      // Dividir equipos por día
      const windows = config.windows as { start: Date; end: Date }[];
      const days    = windows.length;
      const chunk   = Math.ceil(equipos.length / days);
      const porDia: Equipo[][] = [];
      for (let i = 0; i < days; i++) {
        porDia.push(equipos.slice(i * chunk, (i + 1) * chunk));
      }

      // Asignar horarios de equipos
      const evalStarts: Date[] = [];
      porDia.forEach((eqs, i) => {
        const win       = windows[i];
        const isLastDay = (i === days - 1);
        const fin       = asignarHorarios(eqs, config, win.start, win.end, isLastDay);
        evalStarts.push(fin);
      });

      // Asignar horarios de jueces
      const jueces: Juez[] = asignarHorariosJueces(equipos, config, evalStarts);

      // Generar HTML del horario y abrir en nueva pestaña
      const html = generateHorarioHtml(equipos);
      const newWin = window.open();
      if (newWin) {
        newWin.document.write(html);
        newWin.document.close();
      }

      // Renderizar botones de descarga en la app
      appDiv.innerHTML = '';

      // Botón: Descargar HTML del horario
      const btnHtml = document.createElement('button');
      btnHtml.textContent = 'Descargar Horario (HTML)';
      btnHtml.onclick = () => {
        const blob = new Blob([html], { type: 'text/html' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'horario.html';
        a.click();
        URL.revokeObjectURL(url);
      };
      appDiv.appendChild(btnHtml);

      // Botón: Horario Maestro (Excel)
      const btnM = document.createElement('button');
      btnM.textContent = 'Descargar Horario Maestro (XLSX)';
      btnM.onclick     = () => generarExcelMaster(equipos);
      appDiv.appendChild(btnM);

      // Botones: Horario por Equipo
      const teamDiv = document.createElement('div');
      equipos.forEach(eq => {
        const b = document.createElement('button');
        b.textContent = eq.nombre;
        b.onclick     = () => generarExcelEquipo(eq);
        teamDiv.appendChild(b);
      });
      appDiv.appendChild(teamDiv);

      // Botón: Horario Jueces Maestro (Excel)
      const btnJ = document.createElement('button');
      btnJ.textContent = 'Descargar Horario Jueces Maestro (XLSX)';
      btnJ.onclick     = () => generarExcelMasterJueces(jueces);
      appDiv.appendChild(btnJ);

      // Botones: Horario por Juez
      const judgeDiv = document.createElement('div');
      jueces.forEach(j => {
        const b = document.createElement('button');
        b.textContent = `Juez ${j.tipo} ${j.id}`;
        b.onclick     = () => generarExcelJuez(j);
        judgeDiv.appendChild(b);
      });
      appDiv.appendChild(judgeDiv);
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
  });
});
