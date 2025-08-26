import ExcelJS from 'exceljs';

export async function downloadInputExcel(): Promise<void> {
  try {
    const workbook = new ExcelJS.Workbook();

    // -------- Hoja Configuración --------
    const configSheet = workbook.addWorksheet('Configuración');
    configSheet.addRow(['Parámetro', 'Valor']);

    // Config de ejemplo (válida para tu StaticConfig + dinámicos)
    const config: Record<string, number | string> = {
      "Nº equipos de Entry": 9,
      "Nº equipos de Development": 10,
      "Nº equipos de Professional": 10,
      "Nº de equipos que se clasifican": 4, // <- necesario para tu StaticConfig
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
      "Duración Knockouts - Eliminatorias": 90,
      "Duración Carrera Entry": 10,
      "Duración Carrera Development": 10,
      "Duración Carrera Professional": 10,
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

    for (const key in config) {
      configSheet.addRow([key, config[key]]);
    }

    // -------- Hoja Equipos --------
    const eqSheet = workbook.addWorksheet('Equipos');
    eqSheet.addRow(['ID', 'Nombre', 'Categoria']);

    let id = 1;
    for (let i = 1; i <= (config["Nº equipos de Entry"] as number); i++, id++) {
      eqSheet.addRow([id, `Equipo Entry ${i}`, 'Entry']);
    }
    for (let i = 1; i <= (config["Nº equipos de Development"] as number); i++, id++) {
      eqSheet.addRow([id, `Equipo Development ${i}`, 'Development']);
    }
    for (let i = 1; i <= (config["Nº equipos de Professional"] as number); i++, id++) {
      eqSheet.addRow([id, `Equipo Professional ${i}`, 'Professional']);
    }

    // -------- Descargar como .xlsx en el navegador --------
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob(
      [buffer],
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config-ejemplo.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Pequeño delay mejora compatibilidad (p.ej. Safari)
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error(err);
    alert('No se pudo generar el Excel de ejemplo.');
  }
}
