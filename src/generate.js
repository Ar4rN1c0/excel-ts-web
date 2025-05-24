import ExcelJS from 'exceljs';

async function generarDummyInput() {
  const workbook = new ExcelJS.Workbook();
  const configSheet = workbook.addWorksheet('Configuración');
  configSheet.addRow(['Parámetro', 'Valor']);

  const numEntry = 40;
  const numDevelopment = 40;
  const numProfessional = 30;
  const totalEquipos = numEntry + numDevelopment + numProfessional;

  configSheet.addRow(['Nº equipos de Entry', numEntry]);
  configSheet.addRow(['Nº equipos de Development', numDevelopment]);
  configSheet.addRow(['Nº equipos de Professional', numProfessional]);
  configSheet.addRow(['Nº de equipos que se clasifican', 4]);

  configSheet.addRow(['Nº de Jueces para el portfolio técnico', 3]);
  configSheet.addRow(['Nº de Jueces para el portfolio de empresa', 3]);
  configSheet.addRow(['Nº de Jueces para el escrutinio', 3]);
  configSheet.addRow(['Nº de Jueces para la presentación verbal', 2]);
  configSheet.addRow(['Nº de personal para el registro', 2]);

  const roundsEntry = 2;
  const roundsDev = 4;
  const roundsProf = 4;
  configSheet.addRow(['Carreras Entry', roundsEntry]);
  configSheet.addRow(['Carreras Development', roundsDev]);
  configSheet.addRow(['Carreras Professional', roundsProf]);

  configSheet.addRow(['NumberOfDays', 3]);

  // Day 1
  configSheet.addRow(['Dia 1 Start', new Date('2025-06-17T07:00:00.000Z').toISOString()]);
  configSheet.addRow(['Dia 1 End', new Date('2025-06-17T17:00:00.000Z').toISOString()]);

  // Day 2
  configSheet.addRow(['Dia 2 Start', new Date('2025-06-18T07:00:00.000Z').toISOString()]);
  configSheet.addRow(['Dia 2 End', new Date('2025-06-18T17:00:00.000Z').toISOString()]);

  // Day 3
  configSheet.addRow(['Dia 3 Start', new Date('2025-06-19T07:00:00.000Z').toISOString()]);
  configSheet.addRow(['Dia 3 End', new Date('2025-06-19T17:00:00.000Z').toISOString()]);
  

  configSheet.addRow(["Duración registro", 5]);
  configSheet.addRow(["Duración Charla/Presentación", 30]);
  configSheet.addRow(["Duración Montaje del Pit Display", 60]);
  configSheet.addRow(["Duración Escrutinio Entry", 15]);
  configSheet.addRow(["Duración Escrutinio Development", 20]);
  configSheet.addRow(["Duración Escrutinio Professional", 25]);
  configSheet.addRow(["Duración Portfolio Técnico Entry", 10]);
  configSheet.addRow(["Duración Portfolio Técnico Development", 15]);
  configSheet.addRow(["Duración Portfolio Técnico Professional", 15]);
  configSheet.addRow(["Duración Portfolio Empresa Entry", 0]);
  configSheet.addRow(["Duración Portfolio Empresa Development", 15]);
  configSheet.addRow(["Duración Portfolio Empresa Professional", 15]);
  configSheet.addRow(["Duración Presentación Verbal Entry", 15]); // fixed from 10
  configSheet.addRow(["Duración Presentación Verbal Development", 15]);
  configSheet.addRow(["Duración Presentación Verbal Professional", 15]);
  configSheet.addRow(["Duración Ceremonia de Clausura y Premios", 60]);
  configSheet.addRow(["Duración Carrera", 10]);
  configSheet.addRow(["Tiempo Eliminatorias", 40]); // 4 * 10

  // Equipos
  const eqSheet = workbook.addWorksheet('Equipos');
  eqSheet.addRow(['ID', 'Nombre', 'Categoria']);
  let id = 1;
  for (let i = 1; i <= numEntry; i++, id++) eqSheet.addRow([id, `Equipo Entry ${i}`, 'Entry']);
  for (let i = 1; i <= numDevelopment; i++, id++) eqSheet.addRow([id, `Equipo Development ${i}`, 'Development']);
  for (let i = 1; i <= numProfessional; i++, id++) eqSheet.addRow([id, `Equipo Professional ${i}`, 'Professional']);

  await workbook.xlsx.writeFile('dummy-input.xlsx');
  console.log(`dummy-input.xlsx generado con ${totalEquipos} equipos.`);
}

generarDummyInput().catch(console.error);
