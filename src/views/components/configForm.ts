import { getCookie, setCookie } from "../../helpers/storage/cookie";
import { GlobalConfig, StaticConfig } from "../../types/types";

const CONFIG_FORM_COOKIE = "configFormData";
const COOKIE_EXPIRES_DAYS = 365;

export async function createConfigForm(): Promise<GlobalConfig> {
    return new Promise((resolve) => {
        document.getElementById('configForm')?.remove();

        function saveToCookie(data: { [key: string]: string }) {
            setCookie(CONFIG_FORM_COOKIE, JSON.stringify(data), COOKIE_EXPIRES_DAYS);
        }
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

        // Make sure "NumberOfDays" is spelled exactly as used everywhere
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
            "Duración Carrera Entry",
            "Duración Carrera Development",
            "Duración Carrera Professional",
            "Tiempo Eliminatorias",
            "Nº de carreras a la vez",
        ];

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

        // Days container
        const daysContainer = document.createElement('div');
        daysContainer.id = "daysContainer";
        form.appendChild(daysContainer);

        // ===== Descansos Section =====
        const descansosContainer = document.createElement('div');
        descansosContainer.id = "descansosContainer";
        descansosContainer.style.margin = "2em 0";
        descansosContainer.innerHTML = `<strong>Descansos (Breaks):</strong><br>`;
        form.appendChild(descansosContainer);

        // Add Descanso button
        const addDescansoBtn = document.createElement('button');
        addDescansoBtn.type = "button";
        addDescansoBtn.textContent = "+ Añadir descanso";
        addDescansoBtn.style.display = "block";
        addDescansoBtn.style.marginBottom = "1em";
        descansosContainer.appendChild(addDescansoBtn);

        let descansos: { name: string; start: string; end: string }[] = [];

        // Restore from cookie
        const saved = loadFromCookie();

        function renderDescansos() {
            descansosContainer.querySelectorAll('.descanso-row').forEach(el => el.remove());
            descansos.forEach((descanso, idx) => {
                const row = document.createElement('div');
                row.className = 'descanso-row';
                row.style.marginBottom = '1em';

                // Name
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.placeholder = 'Nombre';
                nameInput.value = descanso.name;
                nameInput.required = true;
                nameInput.style.width = '8em';
                nameInput.style.marginRight = '1em';
                nameInput.oninput = () => {
                    descansos[idx].name = nameInput.value;
                    saveAllInputsToCookie();
                };

                // Start
                const startInput = document.createElement('input');
                startInput.type = 'datetime-local';
                startInput.placeholder = 'Inicio';
                startInput.value = descanso.start;
                startInput.required = true;
                startInput.style.marginRight = '1em';
                startInput.oninput = () => {
                    descansos[idx].start = startInput.value;
                    saveAllInputsToCookie();
                };

                // End
                const endInput = document.createElement('input');
                endInput.type = 'datetime-local';
                endInput.placeholder = 'Fin';
                endInput.value = descanso.end;
                endInput.required = true;
                endInput.style.marginRight = '1em';
                endInput.oninput = () => {
                    descansos[idx].end = endInput.value;
                    saveAllInputsToCookie();
                };

                // Remove button
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.textContent = 'Eliminar';
                removeBtn.style.marginLeft = '1em';
                removeBtn.onclick = () => {
                    descansos.splice(idx, 1);
                    renderDescansos();
                    saveAllInputsToCookie();
                };

                row.appendChild(nameInput);
                row.appendChild(startInput);
                row.appendChild(endInput);
                row.appendChild(removeBtn);
                descansosContainer.appendChild(row);
            });
        }

        addDescansoBtn.onclick = () => {
            descansos.push({ name: '', start: '', end: '' });
            renderDescansos();
            saveAllInputsToCookie();
        };

        // Save all inputs (static, rounds, days, descansos) to cookie
        function saveAllInputsToCookie() {
            const data: { [key: string]: string } = {};
            Object.keys(inputs).forEach(key => {
                data[key] = inputs[key].value;
            });
            // Save descansos with special keys
            descansos.forEach(d => {
                if (d.name) {
                    data[`Descanso ${d.name} Start`] = d.start;
                    data[`Descanso ${d.name} End`] = d.end;
                }
            });
            saveToCookie(data);
        }

        // Restore static, rounds, and descansos
        if (saved) {
            Object.entries(saved).forEach(([key, value]) => {
                if (inputs[key]) inputs[key].value = value;
            });
            // Restore descansos from saved keys
            const descansoNames = Object.keys(saved)
                .filter(key => key.startsWith("Descanso ") && key.endsWith(" Start"))
                .map(key => key.slice(9, -6).trim());
            descansos = descansoNames.map(name => ({
                name,
                start: saved[`Descanso ${name} Start`] || '',
                end: saved[`Descanso ${name} End`] || ''
            }));
        }

        function updateDayFieldsAndRestore(savedData?: { [key: string]: string }) {
            const val = Number(inputs["NumberOfDays"]?.value);
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

        // Attach NumberOfDays handler if field exists
        if (inputs["NumberOfDays"]) {
            inputs["NumberOfDays"].addEventListener('input', () => updateDayFieldsAndRestore());
            updateDayFieldsAndRestore(saved);
        }

        // Render descansos after possible restore
        renderDescansos();

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
            // Add descansos as dynamic fields
            descansos.forEach(d => {
                if (d.name && d.start && d.end) {
                    config[`Descanso ${d.name} Start`] = d.start;
                    config[`Descanso ${d.name} End`] = d.end;
                }
            });
            form.remove();
            resolve(config as GlobalConfig);
        };

        document.body.appendChild(form);
        form.scrollIntoView({ behavior: 'smooth' });
    });
}
