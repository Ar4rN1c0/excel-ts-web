// generate.js
import ExcelJS from 'exceljs';

async function generarDummyInput() {
  // Crear un nuevo workbook
  const workbook = new ExcelJS.Workbook();

  // Hoja "Configuración" con datos dummy
  const configSheet = workbook.addWorksheet('Configuración');
  // Encabezados
  configSheet.addRow(['Parámetro', 'Valor']);

  // Configuración con más equipos y algunos parámetros adicionales
  const numEntry = 5;
  const numDevelopment = 5;
  const numProfessional = 5;
  const totalEquipos = numEntry + numDevelopment + numProfessional;
  
  configSheet.addRow(['Nº equipos de Entry', numEntry]);
  configSheet.addRow(['Nº equipos de Development', numDevelopment]);
  configSheet.addRow(['Nº equipos de Professional', numProfessional]);
  configSheet.addRow(['Nº de Jueces para el portfolio técnico', 3]);
  configSheet.addRow(['Nº de Jueces para el portfolio de empresa', 3]);
  configSheet.addRow(['Nº de Jueces para la presentación verbal', 2]);
  configSheet.addRow(['Nº de personal para el registro', 2]);
  // Número de carreras clasificatorias (por ejemplo, 3) y tiempo para eliminatorias (en minutos)
  configSheet.addRow(['Nº de carreras clasificatorias', 3]);
  configSheet.addRow(['Tiempo Eliminatorias', 20]);
  // Definir el número de equipos que se clasifican (puede ser menor o igual al total de equipos)
  configSheet.addRow(['Nº de equipos que se clasifican', totalEquipos]);
  // Fecha de inicio (a los 9:00 AM del 1 de mayo de 2025)
  configSheet.addRow(['Fecha de inicio', new Date(2025, 4, 1, 9, 0, 0)]);

  // Hoja "Equipos" con datos dummy
  const equiposSheet = workbook.addWorksheet('Equipos');
  // Encabezados para equipos: ID, Nombre y Categoría
  equiposSheet.addRow(['ID', 'Nombre', 'Categoria']);

  // Generar equipos para cada categoría
  let idCounter = 1;
  for (let i = 1; i <= numEntry; i++) {
    equiposSheet.addRow([idCounter, `Equipo Entry ${i}`, 'Entry']);
    idCounter++;
  }
  for (let i = 1; i <= numDevelopment; i++) {
    equiposSheet.addRow([idCounter, `Equipo Development ${i}`, 'Development']);
    idCounter++;
  }
  for (let i = 1; i <= numProfessional; i++) {
    equiposSheet.addRow([idCounter, `Equipo Professional ${i}`, 'Professional']);
    idCounter++;
  }

  // Escribir el archivo Excel en el sistema de archivos
  await workbook.xlsx.writeFile('dummy-input.xlsx');
  console.log('Archivo dummy-input.xlsx generado correctamente con', totalEquipos, 'equipos.');
}

generarDummyInput().catch((error) => {
  console.error('Error generando el archivo de dummy input:', error);
});
