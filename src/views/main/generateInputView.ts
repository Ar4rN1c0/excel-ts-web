import { Equipo, GlobalConfig } from '../../types/types';
import { handleFileInputChange } from '../../helpers/fileType/excel/handleInputChange';
import { createConfigForm } from '../components/configForm';
import { getRoot } from '../../lib/htmlTools';
import { downloadInputExcel } from '../../helpers/fileType/excel/sampleInput';



// Tipos para los datos procesados
interface ProcessedData {
  config: GlobalConfig,
  teams?: Equipo[]
}

export function generateInputView(): Promise<ProcessedData> {
  return new Promise((resolve, _) => {
    // Remove any previous container
    document.getElementById('inputOrFormContainer')?.remove();

    // Main container
    const container = document.createElement('div');
    container.id = 'inputOrFormContainer';

    // --- Excel Option ---
    const excelBox = document.createElement('div');
    excelBox.classList.add('option-box', 'option-box--excel');

    const excelLabel = document.createElement('h3');
    excelLabel.classList.add('option-title');
    excelLabel.innerHTML = '📁 <span>Subir archivo Excel</span>';
    excelBox.appendChild(excelLabel);

    const excelDesc = document.createElement('p');
    excelDesc.classList.add('option-desc');
    excelDesc.textContent = 'Carga un archivo .xlsx o .xls con la configuración y equipos';
    excelBox.appendChild(excelDesc);

    const excelButton = document.createElement('button');
    excelButton.classList.add('btn', 'btn--excel');
    excelButton.textContent = 'Seleccionar archivo';
    excelBox.appendChild(excelButton);

    // --- Manual Form Option ---
    const formBox = document.createElement('div');
    formBox.classList.add('option-box', 'option-box--form');

    const formLabel = document.createElement('h3');
    formLabel.classList.add('option-title');
    formLabel.innerHTML = '✍️ <span>Llenar formulario manual</span>';
    formBox.appendChild(formLabel);

    const formDesc = document.createElement('p');
    formDesc.classList.add('option-desc');
    formDesc.textContent = 'Completa la configuración manualmente';
    formBox.appendChild(formDesc);

    const formButton = document.createElement('button');
    formButton.classList.add('btn', 'btn--form');
    formButton.textContent = 'Abrir formulario';
    formBox.appendChild(formButton);

    // --- Download Example Excel Option ---
    const downloadBox = document.createElement('div');
    downloadBox.classList.add('option-box', 'option-box--download');

    const downloadLabel = document.createElement('h3');
    downloadLabel.classList.add('option-title');
    downloadLabel.innerHTML = '⬇️ <span>Descargar Excel de Input de ejemplo</span>';
    downloadBox.appendChild(downloadLabel);

    const downloadDesc = document.createElement('p');
    downloadDesc.classList.add('option-desc');
    downloadDesc.textContent = 'Obtén una plantilla de ejemplo para rellenar manualmente';
    downloadBox.appendChild(downloadDesc);

    const downloadButton = document.createElement('button');
    downloadButton.classList.add('btn');
    downloadButton.textContent = 'Descargar Excel';
    downloadButton.onclick = () => downloadInputExcel();
    downloadBox.appendChild(downloadButton);

    const root = getRoot();

    // --- Add to container and document ---
    container.appendChild(excelBox);
    container.appendChild(formBox);
    container.appendChild(downloadBox);
    root.appendChild(container);
    container.scrollIntoView({ behavior: 'smooth' });

    // --- Event Handlers ---

    // Excel: open input file dialog
    excelButton.onclick = () => {
      container.remove();

      const inputFile = document.createElement('input');
      inputFile.type = 'file';
      inputFile.accept = '.xlsx, .xls';
      inputFile.style.display = 'none';

      root.appendChild(inputFile);

      inputFile.addEventListener('change', (event: Event) => {
        handleFileInputChange(event, (result) => {
          inputFile.remove();
          resolve(result);
        }, (err) => {
          inputFile.remove();
          alert('Error al procesar el archivo: ' + err);
          root.appendChild(container);
        });
      });

      inputFile.click();
    };

    // Form: open form
    formButton.onclick = async () => {
      container.remove();
      const { config, teams } = await createConfigForm();
      resolve({ config, teams });
    };
  });
}
