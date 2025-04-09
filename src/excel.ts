import * as XLSX from 'xlsx';

export function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });

    // Se buscan las hojas "Configuración" y "Equipos"
    const configSheet = workbook.Sheets["Configuración"];
    const equiposSheet = workbook.Sheets["Equipos"];

    if (!configSheet || !equiposSheet) {
      console.error("El archivo Excel debe contener las hojas 'Configuración' y 'Equipos'.");
      return;
    }

    const configData = XLSX.utils.sheet_to_json(configSheet, { header: 1, cellDates: true } as any);
    const equiposData = XLSX.utils.sheet_to_json(equiposSheet, { header: 1, cellDates: true } as any);

    console.log("Datos de Configuración:", configData);
    console.log("Datos de Equipos:", equiposData);

    const parsedData = processInputData(configData, equiposData);
    console.log("Datos procesados:", parsedData);
  };

  reader.readAsArrayBuffer(file);
}

function excelDateToJSDate(serial: number): Date {
  return new Date((serial - 25569) * 86400 * 1000);
}

export function processInputData(configData: any[], equiposData: any[]) {
  // Procesar la hoja de "Configuración"
  const config: any = {};
  for (let i = 1; i < configData.length; i++) {
    const row = configData[i];
    if (row && row.length >= 2) {
      const key = row[0];
      let value = row[1];
      if (key === 'Fecha de inicio') {
        if (typeof value === 'number') {
          value = excelDateToJSDate(value);
        } else {
          value = new Date(value);
        }
      }
      config[key] = value;
    }
  }
  
  // Se asignan valores por defecto en caso de no venir en el Excel.
  config["Nº de personal para el registro"] = config["Nº de personal para el registro"] || 1;
  config["Nº de carreras clasificatorias"] = config["Nº de carreras clasificatorias"] || 0;
  config["Tiempo Eliminatorias"] = config["Tiempo Eliminatorias"] || 0;
  config["Nº de Jueces para el portfolio técnico"] = config["Nº de Jueces para el portfolio técnico"] || 0;
  config["Nº de Jueces para el portfolio de empresa"] = config["Nº de Jueces para el portfolio de empresa"] || 0;
  config["Nº de Jueces para la presentación verbal"] = config["Nº de Jueces para la presentación verbal"] || 0;

  // Procesar la hoja de "Equipos"
  // Se asume que la primera fila es el encabezado: ["ID", "Nombre", "Categoria"]
  const equipos = [];
  for (let i = 1; i < equiposData.length; i++) {
    const row = equiposData[i];
    if (row && row.length >= 3) {
      const equipo = {
        id: row[0],
        nombre: row[1],
        categoria: row[2],
        horario: []
      };
      equipos.push(equipo);
    }
  }

  return { config, equipos };
}
