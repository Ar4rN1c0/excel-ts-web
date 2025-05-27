import { Equipo, GlobalConfig } from '../../types/types';
import { handleFileInputChange } from '../../helpers/excel/handleInputChange';
import { createConfigForm } from '../components/configForm';

// Tipos para los datos procesados
interface ProcessedData {
  config: GlobalConfig,
  teams: Equipo[]
}

export function generateInputView(): Promise<ProcessedData> {
  return new Promise((resolve, _) => {
    // Remove any previous container
    document.getElementById('inputOrFormContainer')?.remove();

    // Main container
    const container = document.createElement('div');
    container.id = 'inputOrFormContainer';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.gap = '3em';
    container.style.margin = '3em 0';

    // --- Excel Option ---
    const excelBox = document.createElement('div');
    excelBox.style.flex = '1';
    excelBox.style.background = '#eef4fb';
    excelBox.style.border = '1px solid #a9c3e8';
    excelBox.style.borderRadius = '10px';
    excelBox.style.padding = '2em';
    excelBox.style.textAlign = 'center';
    excelBox.style.boxShadow = "0 3px 14px #0001";
    excelBox.style.transition = "transform 0.1s";
    excelBox.onmouseover = () => excelBox.style.transform = "scale(1.03)";
    excelBox.onmouseleave = () => excelBox.style.transform = "";

    const excelLabel = document.createElement('h3');
    excelLabel.innerHTML = '📁 <span style="color:#2563eb">Subir archivo Excel</span>';
    excelBox.appendChild(excelLabel);

    const excelDesc = document.createElement('p');
    excelDesc.textContent = 'Carga un archivo .xlsx o .xls con la configuración y equipos';
    excelDesc.style.color = '#333';
    excelDesc.style.marginBottom = '1em';
    excelBox.appendChild(excelDesc);

    const excelButton = document.createElement('button');
    excelButton.textContent = 'Seleccionar archivo';
    excelButton.style.padding = "0.7em 2em";
    excelButton.style.borderRadius = "5px";
    excelButton.style.border = "1px solid #2563eb";
    excelButton.style.background = "#2563eb";
    excelButton.style.color = "#fff";
    excelButton.style.cursor = "pointer";
    excelButton.style.fontWeight = "bold";
    excelButton.onmouseover = () => excelButton.style.background = "#1d4bb8";
    excelButton.onmouseleave = () => excelButton.style.background = "#2563eb";

    excelBox.appendChild(excelButton);

    // --- Manual Form Option ---
    const formBox = document.createElement('div');
    formBox.style.flex = '1';
    formBox.style.background = '#f8f7ec';
    formBox.style.border = '1px solid #b8b18b';
    formBox.style.borderRadius = '10px';
    formBox.style.padding = '2em';
    formBox.style.textAlign = 'center';
    formBox.style.boxShadow = "0 3px 14px #0001";
    formBox.style.transition = "transform 0.1s";
    formBox.onmouseover = () => formBox.style.transform = "scale(1.03)";
    formBox.onmouseleave = () => formBox.style.transform = "";

    const formLabel = document.createElement('h3');
    formLabel.innerHTML = '✍️ <span style="color:#a38714">Llenar formulario manual</span>';
    formBox.appendChild(formLabel);

    const formDesc = document.createElement('p');
    formDesc.textContent = 'Completa la configuración manualmente';
    formDesc.style.color = '#333';
    formDesc.style.marginBottom = '1em';
    formBox.appendChild(formDesc);

    const formButton = document.createElement('button');
    formButton.textContent = 'Abrir formulario';
    formButton.style.padding = "0.7em 2em";
    formButton.style.borderRadius = "5px";
    formButton.style.border = "1px solid #a38714";
    formButton.style.background = "#a38714";
    formButton.style.color = "#fff";
    formButton.style.cursor = "pointer";
    formButton.style.fontWeight = "bold";
    formButton.onmouseover = () => formButton.style.background = "#7a6310";
    formButton.onmouseleave = () => formButton.style.background = "#a38714";

    formBox.appendChild(formButton);

    // --- Add to container and document ---
    container.appendChild(excelBox);
    container.appendChild(formBox);
    document.body.appendChild(container);
    container.scrollIntoView({ behavior: 'smooth' });

    // --- Event Handlers ---

    // Excel: open input file dialog, handle as before
    excelButton.onclick = () => {
      // Remove container to avoid confusion
      container.remove();

      // Create hidden input (reusing your old pattern)
      const inputFile = document.createElement('input');
      inputFile.type = 'file';
      inputFile.accept = '.xlsx, .xls';
      inputFile.style.display = 'none';

      document.body.appendChild(inputFile);

      inputFile.addEventListener('change', (event: Event) => {
        handleFileInputChange(event, (result) => {
          inputFile.remove();
          resolve(result); // as-is
        }, (err) => {
          inputFile.remove();
          alert("Error al procesar el archivo: " + err);
          // Optionally, re-show the original menu:
          document.body.appendChild(container);
        });
      });

      inputFile.click();
    };

    // Form: open form, resolve with {config, []}
    formButton.onclick = async () => {
      container.remove();
      const config = await createConfigForm();
      resolve({ config, teams: [] });
    };
  });
}
