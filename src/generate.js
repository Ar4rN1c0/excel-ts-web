import ExcelJS from 'exceljs';

async function generarDummyInput() {
  const workbook = new ExcelJS.Workbook();
  const configSheet = workbook.addWorksheet('Configuración');
  configSheet.addRow(['Parámetro', 'Valor']);

  // Configuration values
  const config = {
    "Nº equipos de Entry": 9,
    "Nº equipos de Development": 10,
    "Nº equipos de Professional": 10,
    "Nº de Jueces para el portfolio técnico": 2,
    "Nº de Jueces para el portfolio de empresa": 2,
    "Nº de Jueces para el escrutinio": 3,
    "Nº de Jueces para la presentación verbal": 2,
    "Nº de personal para el registro": 3,
    "Carreras Entry": 1,
    "Carreras Development": 2,
    "Carreras Professional": 2,
    "NumberOfDays": 3,
    "Duración registro": 5,
    "Duración Charla/Presentación": 40,
    "Duración Montaje del Pit Display": 60,
    "Duración Escrutinio Entry": 15,
    "Duración Escrutinio Development": 15,
    "Duración Escrutinio Professional": 15,
    "Duración Portfolio Técnico Entry": 20,
    "Duración Portfolio Técnico Development": 20,
    "Duración Portfolio Técnico Professional": 20,
    "Duración Portfolio Empresa Entry": 20,
    "Duración Portfolio Empresa Development": 20,
    "Duración Portfolio Empresa Professional": 20,
    "Duración Presentación Verbal Entry": 20,
    "Duración Presentación Verbal Development": 20,
    "Duración Presentación Verbal Professional": 20,
    "Duración Ceremonia de Clausura y Premios": 60,
    "Duración Cómputo de Puntos": 90,
    "Duración Carrera Entry": 10,
    "Duración Carrera Development": 10,
    "Duración Carrera Professional": 10,
    "Tiempo Eliminatorias": 23,
    "Nº de carreras a la vez": 2,
    "Dia de Escrutinio": "2025-01-01",
    "Modalidad de Escrutinio": "Desestructurado",
    "Duración Escrutinio Fase 1": 5,
    "Duración Escrutinio Fase 2": 10,
    "Duración Escrutinio Fase 3": 5,
    "Dia 1 Start": "2025-01-01T09:00",
    "Dia 1 End": "2025-01-01T19:00",
    "Dia 2 Start": "2025-01-02T09:00",
    "Dia 2 End": "2025-01-02T13:00",
    "Dia 3 Start": "2025-01-03T09:00",
    "Dia 3 End": "2025-01-03T19:00",
    "Descanso Comida dia 1 Start": "2025-01-01T14:00",
    "Descanso Comida dia 1 End": "2025-01-01T15:00",
    "Descanso Comida dia 2 Start": "2025-01-02T10:00",
    "Descanso Comida dia 2 End": "2025-01-02T11:00",
  };


  // Add static and dynamic config values
  for (const key in config) {
    configSheet.addRow([key, config[key]]);
  }


  // Equipos sheet
  const eqSheet = workbook.addWorksheet('Equipos');
  eqSheet.addRow(['ID', 'Nombre', 'Categoria']);
  let id = 1;
  for (let i = 1; i <= config["Nº equipos de Entry"]; i++, id++) {
    eqSheet.addRow([id, `Equipo Entry ${i}`, 'Entry']);
  }
  for (let i = 1; i <= config["Nº equipos de Development"]; i++, id++) {
    eqSheet.addRow([id, `Equipo Development ${i}`, 'Development']);
  }
  for (let i = 1; i <= config["Nº equipos de Professional"]; i++, id++) {
    eqSheet.addRow([id, `Equipo Professional ${i}`, 'Professional']);
  }

  await workbook.xlsx.writeFile('dummy-input.xlsx');
  console.log('dummy-input.xlsx generado según la configuración solicitada.');
}

generarDummyInput().catch(console.error);
