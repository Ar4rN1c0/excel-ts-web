// src/main.ts

import './style.css';
import * as XLSX from 'xlsx';
import { processInputData } from './excel';
import { generarExcelEquipo, generarExcelMaster, generarExcelMasterJueces } from './output';
import { asignarHorarios, asignarHorariosJueces } from './timetable';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  const appDiv    = document.getElementById('app')!;

  fileInput.addEventListener('change', () => {
    if (!fileInput.files?.length) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data     = new Uint8Array(reader.result as ArrayBuffer);
      // Leemos fechas como Date sin conversión a UTC
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });

      const cfgSheet = workbook.Sheets['Configuración'];
      const eqsSheet = workbook.Sheets['Equipos'];
      if (!cfgSheet || !eqsSheet) {
        appDiv.textContent = "Faltan las hojas 'Configuración' o 'Equipos'.";
        return;
      }

      // raw:true para que las fechas vengan como Date
      const configData  = XLSX.utils.sheet_to_json(cfgSheet,  { header: 1, raw: true }) as any[][];
      const equiposData = XLSX.utils.sheet_to_json(eqsSheet, { header: 1, raw: true }) as any[][];

      const { config, equipos } = processInputData(configData, equiposData);
      const jueces = asignarHorariosJueces(equipos, config);
      asignarHorarios(equipos, config, config['Fecha de inicio']);

      appDiv.innerHTML = '';

      const btnMaster = document.createElement('button');
      btnMaster.textContent = "Descargar Horario Maestro";
      btnMaster.onclick   = () => generarExcelMaster(equipos);
      appDiv.appendChild(btnMaster);

      const teamContainer = document.createElement('div');
      equipos.forEach(eq => {
        const btn = document.createElement('button');
        btn.textContent = eq.nombre;
        btn.onclick   = () => generarExcelEquipo(eq);
        teamContainer.appendChild(btn);
      });
      appDiv.appendChild(teamContainer);

      const btnJueces = document.createElement('button');
      btnJueces.textContent = "Descargar Horario Jueces";
      btnJueces.onclick = () => generarExcelMasterJueces(jueces);
      appDiv.appendChild(btnJueces);
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
  });
});
