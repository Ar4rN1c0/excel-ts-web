export function selectScheduleKey(keys: string[]): Promise<string> {
    return new Promise((resolve) => {
        // Create overlay
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

        // Create container
        const container = document.createElement("div");
        container.style.background = "white";
        container.style.padding = "20px";
        container.style.borderRadius = "8px";
        container.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "10px";

        // Create select element
        const select = document.createElement("select");
        for (let key of keys) {
            const option = document.createElement("option");
            key = key.replace(/^Schedule: /, "")
            option.value = key;
            option.textContent = key;
            select.appendChild(option);
        }

        // Create confirm button
        const button = document.createElement("button");
        button.textContent = "Confirm";

        // Handle confirm
        button.onclick = () => {
            document.body.removeChild(overlay);
            resolve("Schedule: " + select.value);
        };

        // Append elements
        container.appendChild(select);
        container.appendChild(button);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
    });
}
