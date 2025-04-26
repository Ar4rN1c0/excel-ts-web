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

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const appDiv    = document.getElementById('app')!;

  fileInput.addEventListener('change', () => {
    if (!fileInput.files?.length) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data     = new Uint8Array(e.target!.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });

      const confS = workbook.Sheets["Configuración"];
      const eqS   = workbook.Sheets["Equipos"];
      if (!confS || !eqS) {
        appDiv.innerHTML = "El Excel debe tener hojas 'Configuración' y 'Equipos'";
        return;
      }

      // ── Cast para TS2322 ────────────────────────────────
      const cfgArr = XLSX.utils.sheet_to_json(confS, { header:1, cellDates:true } as any) as any[][];
      const eqArr  = XLSX.utils.sheet_to_json(eqS,   { header:1, cellDates:true } as any) as any[][];
      // ─────────────────────────────────────────────────────

      const { config, equipos } = processInputData(cfgArr, eqArr) as {
        config: any,
        equipos: Equipo[]
      };

      const windows = config.windows as { start: Date, end: Date }[];
      const days    = windows.length;
      const chunk   = Math.ceil(equipos.length / days);
      const porDia: Equipo[][] = [];
      for (let i = 0; i < days; i++) {
        porDia.push(equipos.slice(i * chunk, (i + 1) * chunk));
      }

      // Asignamos horarios por día (el último día genera la clausura)
      const evalStarts: Date[] = [];
      porDia.forEach((eqs, i) => {
        const win       = windows[i];
        const isLastDay = (i === days - 1);
        const fin       = asignarHorarios(eqs, config, win.start, win.end, isLastDay);
        evalStarts.push(fin);
      });

      // Generamos horarios de jueces
      const jueces: Juez[] = asignarHorariosJueces(equipos, config, evalStarts);

      // ── Render botones de descarga ───────────────────────
      appDiv.innerHTML = '';

      // Maestro de equipos
      const btnM = document.createElement('button');
      btnM.textContent = "Descargar Horario Maestro";
      btnM.onclick     = () => generarExcelMaster(equipos);
      appDiv.appendChild(btnM);

      // Individual equipos
      const teamDiv = document.createElement('div');
      equipos.forEach(eq => {
        const b = document.createElement('button');
        b.textContent = eq.nombre;
        b.onclick     = () => generarExcelEquipo(eq);
        teamDiv.appendChild(b);
      });
      appDiv.appendChild(teamDiv);

      // Maestro de jueces
      const btnJ = document.createElement('button');
      btnJ.textContent = "Descargar Horario Jueces Maestro";
      btnJ.onclick     = () => generarExcelMasterJueces(jueces);
      appDiv.appendChild(btnJ);

      // Individual jueces
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
