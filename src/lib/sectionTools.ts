import { el } from "./htmlTools";

type ButtonConfig = {
    text: string;
    ariaLabel: string;
    className?: string; // default: "btn btn--add"
};

export type CreateSectionResult = {
    fieldset: HTMLFieldSetElement;
    legend: HTMLLegendElement;
    container: HTMLDivElement;
    addButton?: HTMLButtonElement;
};

/**
 * Build a standard "section" block:
 * <fieldset class="section" id?=...>
 *   <legend>...</legend>
 *   <div class="...">...</div>
 *   [optional] <button type="button" ...>...</button>
 * </fieldset>
 *
 * Returns the created nodes so callers can append children or wire events.
 */
export function createSection(opts: {
    id?: string;
    legendText: string;
    containerId?: string;
    containerClass?: string;           // default: "stack"
    fieldsetClass?: string;            // default: "section"
    addButton?: ButtonConfig | null;   // default: undefined (no button)
}): CreateSectionResult {
    const {
        id,
        legendText,
        containerId,
        containerClass = "stack",
        fieldsetClass = "section",
        addButton,
    } = opts;

    const fieldset = el("fieldset", { id, className: fieldsetClass }) as HTMLFieldSetElement;
    const legend = el("legend", { textContent: legendText }) as HTMLLegendElement;
    const container = el("div", { id: containerId, className: containerClass }) as HTMLDivElement;

    fieldset.append(legend, container);

    let addButtonEl: HTMLButtonElement | undefined;
    if (addButton) {
        addButtonEl = el("button", {
            type: "button",
            textContent: addButton.text,
            "aria-label": addButton.ariaLabel,
            className: addButton.className ?? "btn btn--add",
        }) as HTMLButtonElement;
        container.append(addButtonEl);
    }

    return { fieldset, legend, container, addButton: addButtonEl };
}
