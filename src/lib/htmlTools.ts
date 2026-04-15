// Create element (no style prop) — supports aria-* / data-* attributes safely
type ElProps<K extends keyof HTMLElementTagNameMap> =
    // native element properties (minus "style", which we keep separate)
    Partial<Omit<HTMLElementTagNameMap[K], "style">> &
    // HTML attribute-style keys we want to allow
    {
        /** Equivalent to className, but as an attribute */
        class?: string;
    } &
    // Allow any aria-* and data-* attributes
    {
        [A in `aria-${string}`]?: string | number | boolean | null | undefined;
    } & {
        [D in `data-${string}`]?: string | number | boolean | null | undefined;
    };

export const el = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props: ElProps<K> = {},
    ...children: (HTMLElement | string)[]
): HTMLElementTagNameMap[K] => {
    const node = document.createElement(tag) as HTMLElementTagNameMap[K];

    // Assign props: for aria-*/data-* (and other hyphenated keys) use setAttribute,
    // otherwise set as a property so TS keeps native typing.
    for (const [key, rawVal] of Object.entries(props as Record<string, unknown>)) {
        const val = rawVal as any;
        if (val === undefined || val === null || val === false) continue;

        if (key === "class") {
            node.setAttribute("class", String(val));
            continue;
        }

        // Any attribute with a hyphen (e.g., aria-live, aria-label, data-foo)
        if (key.includes("-")) {
            node.setAttribute(key, val === true ? "" : String(val));
            continue;
        }

        // Fallback to property assignment (covers id, htmlFor, tabIndex, role, etc.)
        (node as any)[key] = val;
    }

    for (const c of children) node.append(c);
    return node;
};

export const setStyles = (node: HTMLElement, styles: Partial<CSSStyleDeclaration>) => {
    Object.assign(node.style, styles);
};

export const labeledInput = (
    label: string,
    name: string,
    type: "number" | "text" | "date" | "datetime-local" = "number",
    required: boolean = true
) => {

    const input = el("input", { type, id: name, name, required }) as HTMLInputElement;
    setStyles(input, { marginLeft: "1em" });
    if (type === "number") setStyles(input, { width: "6em" });
    if (type === "datetime-local") setStyles(input, { width: "16em" });
    if (type === "date") setStyles(input, { width: "12em" });

    const container = el(
        "div",
        {},
        el("label", { htmlFor: name, textContent: `${label}: ` }),
        input
    );
    setStyles(container, { marginBottom: "1em" });

    return { container, input };
};

// ---- NEW: datetime helpers
export const getDatePart = (v: string) => (v ? v.split("T")[0] : "");
export const getTimePart = (v: string) => {
    if (!v) return "";
    const parts = v.split("T");
    return parts[1] ?? "";
};

/** Copy the DATE from src to dst. If dst already has a time, keep it; else copy src time. */
export const syncDateOnly = (src: HTMLInputElement, dst: HTMLInputElement) => {
    const sVal = src.value;
    if (!sVal) return;
    const date = getDatePart(sVal);
    const dstTime = getTimePart(dst.value) || getTimePart(sVal);
    if (date && dstTime) dst.value = `${date}T${dstTime}`;
    else if (date) dst.value = `${date}T00:00`; // fallback to a valid value
    dst.dispatchEvent(new Event("input", { bubbles: true })); // keep cookie in sync
};


export function getRoot(): HTMLElement {
  let root = document.getElementById("root");
  if (!root) {
    root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);
  }
  return root;
}
