import { parseStateFromJSON } from "../../helpers/fileType/json/parseStateFromJSON";
import { State } from "../../types/types";

export function selectScheduleSource(keys: string[]): Promise<{ type: "local", key: string } | { type: "upload", state: State }> {
    return new Promise((resolve) => {
        // Overlay
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "rgba(0,0,0,0.2)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "9999";

        // Main container
        const container = document.createElement("div");
        container.style.background = "white";
        container.style.padding = "24px";
        container.style.borderRadius = "12px";
        container.style.boxShadow = "0 2px 12px rgba(0,0,0,0.2)";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "18px";
        container.style.minWidth = "320px";
        container.style.maxWidth = "90vw";

        // Title
        const title = document.createElement("h2");
        title.textContent = "Load schedule";
        title.style.marginBottom = "0";
        title.style.textAlign = "center";
        container.appendChild(title);

        // Option 1: LocalStorage
        const localDiv = document.createElement("div");
        localDiv.style.display = "flex";
        localDiv.style.flexDirection = "column";
        localDiv.style.alignItems = "center";
        localDiv.style.gap = "8px";

        const localLabel = document.createElement("label");
        localLabel.textContent = "Select from saved schedules:";
        localLabel.style.fontWeight = "500";
        localDiv.appendChild(localLabel);

        const select = document.createElement("select");
        for (let key of keys) {
            const option = document.createElement("option");
            const shortKey = key.replace(/^Schedule: /, "");
            option.value = key;
            option.textContent = shortKey;
            select.appendChild(option);
        }
        localDiv.appendChild(select);

        const selectBtn = document.createElement("button");
        selectBtn.textContent = "Load selected";
        selectBtn.onclick = () => {
            document.body.removeChild(overlay);
            resolve({ type: "local", key: select.value });
        };
        localDiv.appendChild(selectBtn);

        // Separator
        const sep = document.createElement("div");
        sep.style.textAlign = "center";
        sep.style.margin = "12px 0";
        sep.innerHTML = '<span style="color: #aaa;">or</span>';

        // Option 2: Upload JSON
        const uploadDiv = document.createElement("div");
        uploadDiv.style.display = "flex";
        uploadDiv.style.flexDirection = "column";
        uploadDiv.style.alignItems = "center";
        uploadDiv.style.gap = "8px";

        const uploadLabel = document.createElement("label");
        uploadLabel.textContent = "Upload your schedule file (.json):";
        uploadLabel.style.fontWeight = "500";
        uploadDiv.appendChild(uploadLabel);

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".json,application/json";
        uploadDiv.appendChild(fileInput);

        const uploadBtn = document.createElement("button");
        uploadBtn.textContent = "Load uploaded file";
        uploadBtn.onclick = () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) {
                alert("Please choose a file first.");
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target?.result as string;
                    const state = parseStateFromJSON(text);
                    document.body.removeChild(overlay);
                    if(!state) throw new Error("Could not extract state from given file");
                    resolve({ type: "upload", state });
                } catch (err) {
                    alert("Invalid file format or corrupted file.");
                }
            };
            reader.readAsText(file);
        };
        uploadDiv.appendChild(uploadBtn);

        // Append everything
        container.appendChild(localDiv);
        container.appendChild(sep);
        container.appendChild(uploadDiv);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
    });
}
