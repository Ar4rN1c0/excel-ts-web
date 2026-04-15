import ExcelJS from 'exceljs';

export async function downloadInputExcel(): Promise<void> {
  try {
    const workbook = new ExcelJS.Workbook();

    // -------- Hoja Configuración --------
    const configSheet = workbook.addWorksheet('Configuración');
    configSheet.addRow(['Parámetro', 'Valor']);

    // Mantener el orden exacto que indicaste
    const configEntries: [string, number | string][] = [
      ['Nº equipos de Entry', 4],
      ['Nº equipos de Development', 5],
      ['Nº equipos de Professional', 5],

      ['Nº de Jueces para el portfolio técnico', 3],
      ['Nº de Jueces para el portfolio de empresa', 2],
      ['Nº de Jueces para el escrutinio', 3],
      ['Nº de Jueces para la presentación verbal', 2],
      ['Nº de personal para el registro', 5],
      ['Carreras Entry', 3],
      ['Carreras Development', 3],
      ['Carreras Professional', 3],
      ['NumberOfDays', 3],
      ['Duración registro', 8],
      ['Duración Charla/Presentación', 20],
      ['Duración Montaje del Pit Display', 72],
      ['Duración Escrutinio Entry', 15],
      ['Duración Escrutinio Development', 15],
      ['Duración Escrutinio Professional', 15],
      ['Duración Portfolio Técnico Entry', 24],
      ['Duración Portfolio Técnico Development', 20],
      ['Duración Portfolio Técnico Professional', 20],
      ['Duración Portfolio Empresa Entry', 0],
      ['Duración Portfolio Empresa Development', 20],
      ['Duración Portfolio Empresa Professional', 20],
      ['Duración Presentación Verbal Entry', 20],
      ['Duración Presentación Verbal Development', 20],
      ['Duración Presentación Verbal Professional', 20],
      ['Duración Ceremonia de Clausura y Premios', 60],
      ['Duración Carrera Entry', 12],
      ['Duración Carrera Development', 12],
      ['Duración Carrera Professional', 12],
      ['Duración Knockouts - Eliminatorias', 60],
      ['Nº de carreras a la vez', 1],
      ['Dia de Escrutinio', '6/17/25'],
      ['Modalidad de Escrutinio', 'Estructurado'],
      ['Duración Escrutinio Fase 1', 5],
      ['Duración Escrutinio Fase 2', 10],
      ['Duración Escrutinio Fase 3', 5],
      ['Dia 1 Start', '2025-06-17T09:30'],
      ['Dia 1 End', '2025-06-17T18:30'],
      ['Dia 2 Start', '2025-06-18T09:30'],
      ['Dia 2 End', '2025-06-18T18:30'],
      ['Dia 3 Start', '2025-06-19T09:30'],
      ['Dia 3 End', '2025-06-19T18:30'],
      ['Descanso Comida día 1 Start', '2025-06-17T14:00'],
      ['Descanso Comida día 1 End', '2025-06-17T14:40'],
      ['Descanso Comida día 2 Start', '2025-06-18T14:00'],
      ['Descanso Comida día 2 End', '2025-06-18T14:40'],
      ['Descanso Comida día 3 Start', '2025-06-19T14:00'],
      ['Descanso Comida día 3 End', '2025-06-19T14:40'],
      ['Duración Escrutinio Entry Fase 1', 5],
      ['Duración Escrutinio Entry Fase 2', 5],
      ['Duración Escrutinio Entry Fase 3', 5],
      ['Duración Escrutinio Development Fase 1', 5],
      ['Duración Escrutinio Development Fase 2', 5],
      ['Duración Escrutinio Development Fase 3', 5],

      ['Duración Escrutinio Professional Fase 1', 5],
      ['Duración Escrutinio Professional Fase 2', 5],
      ['Duración Escrutinio Professional Fase 3', 5],

      ['Número de Fases Entry', 3],
      ['Número de Fases Development', 3],
      ['Número de Fases Professional', 3],
    ];

    // Escribir filas en el orden dado
    for (const [k, v] of configEntries) configSheet.addRow([k, v]);

    // Para acceder a valores concretos (crear equipos), construimos un Map
    const configMap = new Map(configEntries);

    // -------- Hoja Equipos --------
    const eqSheet = workbook.addWorksheet('Equipos');
    eqSheet.addRow(['ID', 'Nombre', 'Categoria']);

    const entryCount = Number(configMap.get('Nº equipos de Entry') ?? 0);
    const devCount = Number(configMap.get('Nº equipos de Development') ?? 0);
    const proCount = Number(configMap.get('Nº equipos de Professional') ?? 0);

    let id = 1;
    for (let i = 1; i <= entryCount; i++, id++) {
      eqSheet.addRow([id, `Equipo Entry ${i}`, 'Entry']);
    }
    for (let i = 1; i <= devCount; i++, id++) {
      eqSheet.addRow([id, `Equipo Development ${i}`, 'Development']);
    }
    for (let i = 1; i <= proCount; i++, id++) {
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

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    console.error(err);
    alert('No se pudo generar el Excel de ejemplo.');
  }
}
