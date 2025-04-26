// scripts/generate.js
import ExcelJS from 'exceljs';

async function generarDummyInput() {
  const workbook    = new ExcelJS.Workbook();
  const configSheet = workbook.addWorksheet('Configuración');
  configSheet.addRow(['Parámetro','Valor']);

  // ----- Parámetros base -----
  const numEntry        = 5;
  const numDevelopment  = 5;
  const numProfessional = 7;
  const totalEquipos    = numEntry + numDevelopment + numProfessional;

  configSheet.addRow(['Nº equipos de Entry',       numEntry]);
  configSheet.addRow(['Nº equipos de Development', numDevelopment]);
  configSheet.addRow(['Nº equipos de Professional',numProfessional]);

  configSheet.addRow(['Nº de Jueces para el portfolio técnico',  3]);
  configSheet.addRow(['Nº de Jueces para el portfolio de empresa',3]);
  configSheet.addRow(['Nº de Jueces para la presentación verbal', 2]);
  configSheet.addRow(['Nº de personal para el registro',        2]);

  // ----- Rounds por categoría (7 min) -----
  const roundsEntry = 2;
  const roundsDev   = 4;
  const roundsProf  = 4;
  configSheet.addRow(['Carreras Entry',        roundsEntry]);
  configSheet.addRow(['Carreras Development',  roundsDev]);
  configSheet.addRow(['Carreras Professional', roundsProf]);

  // ----- Días y ventanas -----
  const days = [
    { start: new Date(2025,5,17,16,0), end: new Date(2025,5,17,19,0) },
    { start: new Date(2025,5,18, 9,0), end: new Date(2025,5,18,18,0) },
    { start: new Date(2025,5,19, 9,0), end: new Date(2025,5,19,14,0) }
  ];
  configSheet.addRow(['Nº de Días', days.length]);
  days.forEach((w, i) => {
    configSheet.addRow([`Día ${i+1}`,        w.start]);
    configSheet.addRow([`Inicio Día ${i+1}`, w.start]);
    configSheet.addRow([`Fin Día ${i+1}`,    w.end  ]);
  });

  // ----- Equipos -----
  const eqSheet = workbook.addWorksheet('Equipos');
  eqSheet.addRow(['ID','Nombre','Categoria']);
  let id = 1;
  for (let i = 1; i <= numEntry;       i++, id++) eqSheet.addRow([id, `Equipo Entry ${i}`,       'Entry']);
  for (let i = 1; i <= numDevelopment; i++, id++) eqSheet.addRow([id, `Equipo Development ${i}`, 'Development']);
  for (let i = 1; i <= numProfessional;i++, id++) eqSheet.addRow([id, `Equipo Professional ${i}`, 'Professional']);

  await workbook.xlsx.writeFile('dummy-input.xlsx');
  console.log(`dummy-input.xlsx generado con ${totalEquipos} equipos en ${days.length} días.`);
}

generarDummyInput().catch(console.error);
