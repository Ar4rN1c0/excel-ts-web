/**
 * Creates a styled button that executes the provided onClick function when pressed.
 * @param label - The text for the button.
 * @param onClick - The event handler for the button click.
 * @returns The created HTMLButtonElement.
 */
export function createDownloadButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.textContent = label;
    button.style.margin = "20px";
    button.style.padding = "10px 20px";
    button.style.fontSize = "16px";
    button.style.display = "block";
    button.style.marginBottom = "30px";
    button.addEventListener("click", onClick);
    return button;
}
