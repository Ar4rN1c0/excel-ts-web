/**
 * Creates a styled button that executes the provided onClick function when pressed.
 * @param label - The text for the button.
 * @param onClick - The event handler for the button click.
 * @returns The created HTMLButtonElement.
 */
export function createDownloadButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
}
