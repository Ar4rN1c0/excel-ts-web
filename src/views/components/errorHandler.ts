export function showErrorUI(error: unknown): void {
  // Clear existing content
  document.body.innerHTML = '';

  // Create error container
  const errorContainer = document.createElement('div');
  errorContainer.style.padding = '20px';
  errorContainer.style.backgroundColor = '#ffeeee';
  errorContainer.style.color = '#cc0000';
  errorContainer.style.border = '1px solid #cc0000';
  errorContainer.style.borderRadius = '5px';
  errorContainer.style.fontFamily = 'sans-serif';
  errorContainer.style.margin = '20px';

  // Title
  const title = document.createElement('h2');
  title.textContent = '⚠️ Ha ocurrido un error';
  errorContainer.appendChild(title);

  // Friendly message
  const message = document.createElement('p');
  message.textContent = 'Ocurrió un problema al procesar el archivo. Por favor, verifica que los datos sean correctos e inténtalo de nuevo.';
  errorContainer.appendChild(message);

  // Technical details (optional)
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'Detalles técnicos';
  details.appendChild(summary);

  const pre = document.createElement('pre');
  pre.textContent = error instanceof Error
    ? error.stack || error.message
    : JSON.stringify(error, null, 2);
  details.appendChild(pre);

  errorContainer.appendChild(details);

  // Append to body
  document.body.appendChild(errorContainer);
}
