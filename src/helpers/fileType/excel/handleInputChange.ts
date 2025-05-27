import * as XLSX from 'xlsx';  
import { processExcelData } from './excel';
import { Equipo, GlobalConfig } from '../../../types/types';

// Tipos para los datos procesados
interface ProcessedData {
  config: GlobalConfig,
  teams: Equipo[]
}

export function handleFileInputChange(
  event: Event, 
  resolve: (value: ProcessedData) => void, 
  reject: (reason?: any) => void
) {
  const target = event.target as HTMLInputElement | null;

  if (target && target.files) { 
    const file = target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        const data = e.target?.result;
        if (data instanceof ArrayBuffer) {
          try {
            const workbook = XLSX.read(data, { type: 'array' });

            const configSheet = workbook.Sheets['Configuración'];
            const teamSheet = workbook.Sheets['Equipos'];

            const configData: any[][] = XLSX.utils.sheet_to_json(configSheet, { header: 1 }) as any[][];
            const equiposData: any[][] = XLSX.utils.sheet_to_json(teamSheet, { header: 1 }) as any[][];

            const { config, teams } = processExcelData(configData, equiposData);
            resolve({ config, teams });
          } catch (error) {
            reject('Error al procesar los datos del archivo');
          }
        } else {
          reject('Error al leer el contenido del archivo');
        }
      };

      reader.onerror = () => {
        reject('Error al leer el archivo Excel');
      };

      reader.readAsArrayBuffer(file);
    } else {
      reject('No se seleccionó ningún archivo');
    }
  } else {
    reject('No se seleccionó ningún archivo');
  }
}