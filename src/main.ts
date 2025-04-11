// main.ts

import './style.css';
import * as XLSX from 'xlsx';
import { processInputData } from './excel';
import { generarExcelEquipo, generarExcelMaster, generarExcelMasterJueces } from './output';
import { Equipo, asignarHorarios, asignarHorariosJueces, Juez } from './timetable';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const appDiv = document.getElementById('app');

  fileInput.addEventListener('change', () => {
    if (!fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Obtener las hojas "Configuración" y "Equipos"
      const configSheet = workbook.Sheets["Configuración"];
      const equiposSheet = workbook.Sheets["Equipos"];
      
      if (!configSheet || !equiposSheet) {
        console.error("El archivo Excel debe contener las hojas 'Configuración' y 'Equipos'.");
        if (appDiv) {
          appDiv.innerHTML = "El archivo Excel debe contener las hojas 'Configuración' y 'Equipos'.";
        }
        return;
      }
      
      // Convertir hojas a arrays (con cellDates activado)
      const configData = XLSX.utils.sheet_to_json(configSheet, { header: 1, cellDates: true } as any);
      const equiposData = XLSX.utils.sheet_to_json(equiposSheet, { header: 1, cellDates: true } as any);

      const { config, equipos } = processInputData(configData, equiposData) as { config: any, equipos: Equipo[] };

      // Convertir "Fecha de inicio" a Date, en caso de ser necesario
      const fechaInicio = config['Fecha de inicio'] instanceof Date 
        ? config['Fecha de inicio'] 
        : new Date(config['Fecha de inicio']);

      // Asignar horarios a equipos (con eventos globales y locales)
      asignarHorarios(equipos, config, fechaInicio);

      // Asignar horarios a jueces usando la hora global de inicio de evaluaciones (guardada en config.globalEvalStart)
      const jueces: Juez[] = asignarHorariosJueces(equipos, config, config.globalEvalStart);

      if (appDiv) {
        appDiv.innerHTML = '';

        // Botón para descargar el Horario Maestro de equipos
        const btnMaster = document.createElement('button');
        btnMaster.textContent = "Descargar Horario Maestro";
        btnMaster.addEventListener('click', () => {
          generarExcelMaster(equipos);
        });
        appDiv.appendChild(btnMaster);

        // Sección de botones para cada equipo
        const teamContainer = document.createElement('div');
        teamContainer.id = 'team-buttons';
        equipos.forEach((equipo) => {
          const btn = document.createElement('button');
          btn.textContent = equipo.nombre;
          btn.addEventListener('click', () => {
            generarExcelEquipo(equipo);
          });
          teamContainer.appendChild(btn);
        });
        appDiv.appendChild(teamContainer);

        // Botón para descargar el horario maestro para todos los jueces
        const btnJuecesMaster = document.createElement('button');
        btnJuecesMaster.textContent = "Descargar Horario Jueces";
        btnJuecesMaster.addEventListener('click', () => {
          generarExcelMasterJueces(jueces);
        });
        appDiv.appendChild(btnJuecesMaster);
      }
    };

    reader.readAsArrayBuffer(file);
  });
});
