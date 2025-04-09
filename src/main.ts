import './style.css';
import * as XLSX from 'xlsx';
import { processInputData } from './excel';
import { generarExcelEquipo, generarExcelMaster } from './output';
import { Equipo, asignarHorarios } from './timetable';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const appDiv = document.getElementById('app');

  fileInput.addEventListener('change', () => {
    if (!fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = (e: ProgressEvent<FileReader>) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      // Lectura del workbook; se puede agregar cellDates: true en el sheet_to_json
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
      
      // Convertir las hojas a arrays incluyendo cellDates: true
      const configData = XLSX.utils.sheet_to_json(configSheet, { header: 1, cellDates: true } as any);
      const equiposData = XLSX.utils.sheet_to_json(equiposSheet, { header: 1, cellDates: true } as any);
      
      const { config, equipos } = processInputData(configData, equiposData) as { config: any, equipos: Equipo[] };

      // Debug de "Fecha de inicio"
      console.log("Fecha de inicio (antes de asignarHorarios):", config['Fecha de inicio'], typeof config['Fecha de inicio']);

      // Convertir a Date si es necesario
      const fechaInicio = config['Fecha de inicio'] instanceof Date 
        ? config['Fecha de inicio'] 
        : new Date(config['Fecha de inicio']);

      console.log("fechaInicio valid:", fechaInicio instanceof Date && !isNaN(fechaInicio.getTime()));
      
      asignarHorarios(equipos, config, fechaInicio);
      
      if (appDiv) {
        appDiv.innerHTML = '';

        // Botón para descargar Horario Maestro
        const btnMaster = document.createElement('button');
        btnMaster.textContent = "Descargar Horario Maestro";
        btnMaster.addEventListener('click', () => {
          generarExcelMaster(equipos);
        });
        appDiv.appendChild(btnMaster);

        // Botones para cada equipo
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
      }
    };

    reader.readAsArrayBuffer(file);
  });
});
