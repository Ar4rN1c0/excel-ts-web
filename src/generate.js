// generate.js
import ExcelJS from 'exceljs';

async function generarDummyInput() {
  // Crear un nuevo workbook
  const workbook = new ExcelJS.Workbook();

  // Hoja "Configuración" con datos dummy
  const configSheet = workbook.addWorksheet('Configuración');
  configSheet.addRow(['Parámetro', 'Valor']);

  // Definimos un número mayor de equipos de cada categoría
  const numEntry        = 12;
  const numDevelopment  = 10;
  const numProfessional = 10;
  const totalEquipos    = numEntry + numDevelopment + numProfessional; // 32

  // Parámetros obligatorios
  configSheet.addRow(['Nº equipos de Entry', numEntry]);
  configSheet.addRow(['Nº equipos de Development', numDevelopment]);
  configSheet.addRow(['Nº equipos de Professional', numProfessional]);

  // Número de jueces por tipo
  configSheet.addRow(['Nº de Jueces para el portfolio técnico', 4]);
  configSheet.addRow(['Nº de Jueces para el portfolio de empresa', 4]);
  configSheet.addRow(['Nº de Jueces para la presentación verbal', 3]);

  // Personal para el registro (más de 1 para paralelizar)
  configSheet.addRow(['Nº de personal para el registro', 3]);

  // Clasificatorias y eliminatorias
  configSheet.addRow(['Nº de carreras clasificatorias', 3]);
  configSheet.addRow(['Tiempo Eliminatorias', 20]);

  // Número de equipos que pasan a eliminatorias (debe ser 8, 16 o 32)
  configSheet.addRow(['Nº de equipos que se clasifican', totalEquipos]);

  // Fecha de inicio de la competición
  configSheet.addRow(['Fecha de inicio', new Date(2025, 4, 1, 9, 0, 0)]);

  // Hoja "Equipos" con datos dummy
  const equiposSheet = workbook.addWorksheet('Equipos');
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
  console.log(
    `Archivo dummy-input.xlsx generado correctamente con ${totalEquipos} equipos: ` +
    `${numEntry} Entry, ${numDevelopment} Development, ${numProfessional} Professional.`
  );
}

generarDummyInput().catch((error) => {
  console.error('Error generando el archivo de dummy input:', error);
});
