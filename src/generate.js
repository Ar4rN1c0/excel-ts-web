// dummy-generator.js
import ExcelJS from 'exceljs';

async function generarDummyInput() {
  // Crear un nuevo workbook
  const workbook = new ExcelJS.Workbook();

  // Hoja "Configuración" con datos dummy
  const configSheet = workbook.addWorksheet('Configuración');
  // Encabezados
  configSheet.addRow(['Parámetro', 'Valor']);
  // Datos de configuración
  configSheet.addRow(['Nº equipos de Entry', 2]);
  configSheet.addRow(['Nº equipos de Development', 2]);
  configSheet.addRow(['Nº equipos de Professional', 1]);
  configSheet.addRow(['Nº de Jueces para el portfolio técnico', 3]);
  configSheet.addRow(['Nº de Jueces para el portfolio de empresa', 3]);
  configSheet.addRow(['Nº de Jueces para la presentación verbal', 2]);
  configSheet.addRow(['Nº de personal para el registro', 2]);
  configSheet.addRow(['Nº de carreras clasificatorias', 3]);
  configSheet.addRow(['Nº de equipos que se clasifican', 4]);
  // Modificado: Guardar la fecha como objeto Date en vez de una cadena
  configSheet.addRow(['Fecha de inicio', new Date(2025, 4, 1, 9, 0, 0)]);

  // Hoja "Equipos" con datos dummy
  const equiposSheet = workbook.addWorksheet('Equipos');
  // Encabezados para equipos: ID, Nombre y Categoría
  equiposSheet.addRow(['ID', 'Nombre', 'Categoria']);
  // Datos de equipos de ejemplo
  equiposSheet.addRow([1, 'Equipo A', 'Entry']);
  equiposSheet.addRow([2, 'Equipo B', 'Entry']);
  equiposSheet.addRow([3, 'Equipo C', 'Development']);
  equiposSheet.addRow([4, 'Equipo D', 'Development']);
  equiposSheet.addRow([5, 'Equipo E', 'Professional']);

  // Escribir el archivo Excel en el sistema de archivos
  await workbook.xlsx.writeFile('dummy-input.xlsx');
  console.log('Archivo dummy-input.xlsx generado correctamente.');
}

generarDummyInput().catch((error) => {
  console.error('Error generando el archivo de dummy input:', error);
});
