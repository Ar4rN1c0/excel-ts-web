import { getCookie, setCookie } from "../../helpers/storage/cookie";
import { GlobalConfig, StaticConfig } from "../../types/types";


const CONFIG_FORM_COOKIE = "configFormData";
const COOKIE_EXPIRES_DAYS = 365;


export async function createConfigForm(): Promise<GlobalConfig> {
    return new Promise((resolve) => {
        // Remove old form if any
        document.getElementById('configForm')?.remove();

        // Helper to save to cookie
        function saveToCookie(data: { [key: string]: string }) {
            setCookie(CONFIG_FORM_COOKIE, JSON.stringify(data), COOKIE_EXPIRES_DAYS);
        }
        // Helper to load from cookie
        function loadFromCookie(): { [key: string]: string } | undefined {
            const cookie = getCookie(CONFIG_FORM_COOKIE);
            if (cookie) {
                try {
                    return JSON.parse(cookie);
                } catch (e) { /* ignore */ }
            }
            return undefined;
        }

        const form = document.createElement('form');
        form.id = 'configForm';
        form.style.padding = "2em";
        form.style.background = "#fafafa";
        form.style.border = "1px solid #ccc";
        form.style.margin = "2em";

        const staticFields: (keyof StaticConfig)[] = [
            "Nº equipos de Entry",
            "Nº equipos de Development",
            "Nº equipos de Professional",
            "Nº de equipos que se clasifican",
            "Nº de Jueces para el portfolio técnico",
            "Nº de Jueces para el portfolio de empresa",
            "Nº de Jueces para el escrutinio",
            "Nº de Jueces para la presentación verbal",
            "Nº de personal para el registro",
            "Carreras Entry",
            "Carreras Development",
            "Carreras Professional",
            "NumberOfDays",
            "Duración registro",
            "Duración Charla/Presentación",
            "Duración Montaje del Pit Display",
            "Duración Escrutinio Entry",
            "Duración Escrutinio Development",
            "Duración Escrutinio Professional",
            "Duración Portfolio Técnico Entry",
            "Duración Portfolio Técnico Development",
            "Duración Portfolio Técnico Professional",
            "Duración Portfolio Empresa Entry",
            "Duración Portfolio Empresa Development",
            "Duración Portfolio Empresa Professional",
            "Duración Presentación Verbal Entry",
            "Duración Presentación Verbal Development",
            "Duración Presentación Verbal Professional",
            "Duración Ceremonia de Clausura y Premios",
            "Duración Carrera",
            "Tiempo Eliminatorias",
            "Nº de carreras a la vez",
        ];

        // Helper to create labeled inputs
        function labeledInput(label: string, name: string, type = 'number') {
            const div = document.createElement('div');
            div.style.marginBottom = "1em";
            const lbl = document.createElement('label');
            lbl.textContent = label + ': ';
            lbl.htmlFor = name;
            const input = document.createElement('input');
            input.type = type;
            input.name = name;
            input.id = name;
            input.required = true;
            input.style.marginLeft = "1em";
            input.style.width = "6em";
            div.appendChild(lbl);
            div.appendChild(input);
            return { div, input };
        }

        // Add static fields
        const inputs: { [key: string]: HTMLInputElement } = {};
        for (const field of staticFields) {
            const { div, input } = labeledInput(field, field);
            inputs[field] = input;
            form.appendChild(div);
        }

        // Rounds
        const roundsDiv = document.createElement('div');
        roundsDiv.innerHTML = `<strong>Rounds:</strong><br>`;
        ['Entry', 'Development', 'Professional'].forEach(round => {
            const { div, input } = labeledInput(`Rounds ${round}`, `rounds.${round}`);
            inputs[`rounds.${round}`] = input;
            roundsDiv.appendChild(div);
        });
        form.appendChild(roundsDiv);

        // Container for dynamic day fields
        const daysContainer = document.createElement('div');
        daysContainer.id = "daysContainer";
        form.appendChild(daysContainer);

        // Save all inputs to cookie on change
        function saveAllInputsToCookie() {
            const data: { [key: string]: string } = {};
            Object.keys(inputs).forEach(key => {
                data[key] = inputs[key].value;
            });
            saveToCookie(data);
        }

        // Restore data if present
        const saved = loadFromCookie();
        if (saved) {
            // Fill static fields & rounds
            Object.entries(saved).forEach(([key, value]) => {
                if (inputs[key]) inputs[key].value = value;
            });
        }

        // Handle day fields when NumberOfDays changes (with restoring)
        function updateDayFieldsAndRestore(savedData?: { [key: string]: string }) {
            const val = Number(inputs["NumberOfDays"].value);
            daysContainer.innerHTML = '';
            if (val && val > 0) {
                for (let i = 1; i <= val; i++) {
                    ["Start", "End"].forEach(part => {
                        const div = document.createElement('div');
                        div.style.marginBottom = "1em";
                        const lbl = document.createElement('label');
                        lbl.textContent = `Dia ${i} ${part}: `;
                        lbl.htmlFor = `Dia ${i} ${part}`;
                        const input = document.createElement('input');
                        input.type = 'datetime-local';
                        input.name = `Dia ${i} ${part}`;
                        input.id = `Dia ${i} ${part}`;
                        input.required = true;
                        input.style.marginLeft = "1em";
                        input.style.width = "16em";
                        // Restore if possible
                        if (savedData && savedData[input.name]) {
                            input.value = savedData[input.name];
                        }
                        // Save on change
                        input.addEventListener('change', saveAllInputsToCookie);
                        inputs[`Dia ${i} ${part}`] = input;
                        div.appendChild(lbl);
                        div.appendChild(input);
                        daysContainer.appendChild(div);
                    });
                }
            }
        }

        // Add change listeners to all static fields and rounds
        Object.values(inputs).forEach(input => {
            input.addEventListener('input', saveAllInputsToCookie);
        });

        // Restore dynamic days if needed (order matters)
        inputs["NumberOfDays"].addEventListener('input', () => updateDayFieldsAndRestore());
        // If restoring, trigger day field creation with values
        updateDayFieldsAndRestore(saved);

        // Submit button
        const submit = document.createElement('button');
        submit.type = "submit";
        submit.textContent = "Submit";
        submit.style.marginTop = "2em";
        form.appendChild(submit);

        // Handle submit
        form.onsubmit = (ev) => {
            ev.preventDefault();
            const config: any = {};
            for (const field of staticFields) {
                config[field] = Number(inputs[field].value);
            }
            // Rounds
            config.rounds = {
                Entry: Number(inputs["rounds.Entry"].value),
                Development: Number(inputs["rounds.Development"].value),
                Professional: Number(inputs["rounds.Professional"].value),
            };
            // Dynamic days
            const numDays = Number(inputs["NumberOfDays"].value);
            for (let i = 1; i <= numDays; i++) {
                ["Start", "End"].forEach(part => {
                    const key = `Dia ${i} ${part}`;
                    config[key] = inputs[key].value;
                });
            }
            form.remove();
            // eraseCookie(CONFIG_FORM_COOKIE); // <--- remove or comment out this line!
            resolve(config as GlobalConfig);
        };


        document.body.appendChild(form);
        form.scrollIntoView({ behavior: 'smooth' });
    });
}
