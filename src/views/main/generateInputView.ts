import * as XLSX from 'xlsx';  
import { processInputData } from '../../helpers/excel/excel';

// Tipos para los datos procesados
interface ProcessedData {
  config: any; 
}

export function generateInputView(): Promise<ProcessedData> {
  return new Promise((resolve, reject) => {
    const inputFile = document.createElement('input');
    inputFile.type = 'file';
    inputFile.accept = '.xlsx, .xls';

    document.body.appendChild(inputFile);  // Añadir el input al DOM
    
    // Cuando se selecciona un archivo
    inputFile.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement | null;

      if (target && target.files) { 
        const file = target.files[0];

        if (file) {
          const reader = new FileReader();
          
          // Leer el archivo Excel cuando se cargue
          reader.onload = (e) => {
            const data = e.target?.result;  // El contenido del archivo
            
            if (typeof data === 'string') { 
              // Leer el contenido del archivo como binario
              const workbook = XLSX.read(data, { type: 'binary' });

              const configSheet = workbook.Sheets['Configuración'];
              
              // Convertir las hojas a JSON
              const configData: any[][] = XLSX.utils.sheet_to_json(configSheet, { header: 1 }) as any[][];
              
              // Procesar los datos
              try {
                const { config } = processInputData(configData);
                resolve({ config });  // Resolver con los datos procesados
              } catch (error) {
                reject('Error al procesar los datos del archivo');
              }
            } else {
              reject('Error al leer el contenido del archivo');
            }
          };

          // Manejo de errores durante la lectura del archivo
          reader.onerror = () => {
            reject('Error al leer el archivo Excel');
          };

          // Leer el archivo Excel como binario
          reader.readAsBinaryString(file);
        } else {
          reject('No se seleccionó ningún archivo');
        }
      } else {
        reject('No se seleccionó ningún archivo');
      }
    });
    
    // Hacer que el input de archivo sea visible
    inputFile.click();
  });
}
