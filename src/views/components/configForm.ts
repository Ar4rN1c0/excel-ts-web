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

        // Static fields as before
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
            "Nº de carreras a la vez"
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

        const inputs: { [key: string]: HTMLInputElement | HTMLSelectElement } = {};
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

        // ====== Dia de Escrutinio ======
        const diaEscrutinioDiv = document.createElement('div');
        diaEscrutinioDiv.style.marginBottom = "1em";
        const diaEscrutinioLabel = document.createElement('label');
        diaEscrutinioLabel.textContent = "Dia de Escrutinio: ";
        diaEscrutinioLabel.htmlFor = "Dia de Escrutinio";
        const diaEscrutinioInput = document.createElement('input');
        diaEscrutinioInput.type = 'date';
        diaEscrutinioInput.name = "Dia de Escrutinio";
        diaEscrutinioInput.id = "Dia de Escrutinio";
        diaEscrutinioInput.style.marginLeft = "1em";
        diaEscrutinioInput.style.width = "12em";
        diaEscrutinioDiv.appendChild(diaEscrutinioLabel);
        diaEscrutinioDiv.appendChild(diaEscrutinioInput);
        form.appendChild(diaEscrutinioDiv);
        inputs["Dia de Escrutinio"] = diaEscrutinioInput;

        // ====== Modalidad de Escrutinio ======
        const modalidadDiv = document.createElement('div');
        modalidadDiv.style.marginBottom = "1em";
        const modalidadLabel = document.createElement('label');
        modalidadLabel.textContent = "Modalidad de Escrutinio: ";
        modalidadLabel.htmlFor = "Modalidad de Escrutinio";
        const modalidadSelect = document.createElement('select');
        modalidadSelect.name = "Modalidad de Escrutinio";
        modalidadSelect.id = "Modalidad de Escrutinio";
        ["Estructurado", "Desestructurado"].forEach(optVal => {
            const opt = document.createElement('option');
            opt.value = optVal;
            opt.textContent = optVal;
            modalidadSelect.appendChild(opt);
        });
        modalidadSelect.required = true;
        modalidadSelect.style.marginLeft = "1em";
        modalidadDiv.appendChild(modalidadLabel);
        modalidadDiv.appendChild(modalidadSelect);
        form.appendChild(modalidadDiv);
        inputs["Modalidad de Escrutinio"] = modalidadSelect;

        // ====== Dynamic Circuit Fields ("Duración Escrutinio Fase N") ======
        const circuitosContainer = document.createElement('div');
        circuitosContainer.style.margin = "2em 0";
        circuitosContainer.innerHTML = `<strong>Duración Escrutinio Fase (minutos):</strong><br>`;
        form.appendChild(circuitosContainer);

        const addCircuitoBtn = document.createElement('button');
        addCircuitoBtn.type = "button";
        addCircuitoBtn.textContent = "+ Añadir fase de escrutinio";
        addCircuitoBtn.style.display = "block";
        addCircuitoBtn.style.marginBottom = "1em";
        circuitosContainer.appendChild(addCircuitoBtn);

        let circuitos: { fase: number; duracion: number | '' }[] = [];

        // Visibility function for circuitos section
        function updateCircuitosVisibility() {
            if ((inputs["Modalidad de Escrutinio"] as HTMLSelectElement).value === "Desestructurado") {
                circuitosContainer.style.display = "";
            } else {
                circuitosContainer.style.display = "none";
            }
        }

        // Save all inputs (static, rounds, days, descansos, circuitos) to cookie
        function saveAllInputsToCookie() {
            const data: { [key: string]: string } = {};
            Object.keys(inputs).forEach(key => {
                data[key] = (inputs[key] as HTMLInputElement | HTMLSelectElement).value;
            });
            // Save descansos
            descansos.forEach(d => {
                if (d.name) {
                    data[`Descanso ${d.name} Start`] = d.start;
                    data[`Descanso ${d.name} End`] = d.end;
                }
            });
            // Save circuitos
            circuitos.forEach(c => {
                if (c.fase && c.duracion !== '') {
                    data[`Duración Escrutinio Fase ${c.fase}`] = String(c.duracion);
                }
            });
            saveToCookie(data);
        }

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

        // === CIRCUITOS ===
        function renderCircuitos() {
            circuitosContainer.querySelectorAll('.circuito-row').forEach(el => el.remove());
            circuitos.forEach((circuito, idx) => {
                const row = document.createElement('div');
                row.className = 'circuito-row';
                row.style.marginBottom = '1em';

                const label = document.createElement('label');
                label.textContent = `Duración Fase ${circuito.fase}: `;
                label.style.marginRight = '0.5em';

                const input = document.createElement('input');
                input.type = 'number';
                input.min = '0';
                input.value = circuito.duracion === '' ? '' : String(circuito.duracion);
                input.required = true;
                input.style.width = '7em';
                input.oninput = () => {
                    circuitos[idx].duracion = input.value === '' ? '' : Number(input.value);
                    saveAllInputsToCookie();
                };

                // Remove button
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.textContent = 'Eliminar';
                removeBtn.style.marginLeft = '1em';
                removeBtn.onclick = () => {
                    circuitos.splice(idx, 1);
                    renderCircuitos();
                    saveAllInputsToCookie();
                };

                row.appendChild(label);
                row.appendChild(input);
                row.appendChild(removeBtn);
                circuitosContainer.appendChild(row);
            });
        }

        addCircuitoBtn.onclick = () => {
            let maxFase = circuitos.length > 0 ? Math.max(...circuitos.map(c => c.fase)) : 0;
            circuitos.push({ fase: maxFase + 1, duracion: '' });
            renderCircuitos();
            saveAllInputsToCookie();
        };

        // Restore static, rounds, descansos, dia escrutinio, modalidad, circuitos
        if (saved) {
            Object.entries(saved).forEach(([key, value]) => {
                if (inputs[key]) (inputs[key] as HTMLInputElement | HTMLSelectElement).value = value;
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
            // Restore circuitos
            const circuitoFases = Object.keys(saved)
                .filter(key => key.startsWith("Duración Escrutinio Fase "))
                .map(key => Number(key.replace("Duración Escrutinio Fase ", "")))
                .filter(n => !isNaN(n));
            circuitos = circuitoFases.map(fase => ({
                fase,
                duracion: saved[`Duración Escrutinio Fase ${fase}`] !== undefined
                    ? Number(saved[`Duración Escrutinio Fase ${fase}`])
                    : ''
            }));
        }

        function updateDayFieldsAndRestore(savedData?: { [key: string]: string }) {
            const val = Number((inputs["NumberOfDays"] as HTMLInputElement).value);
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

        // Add change listeners to all static fields, rounds, etc
        Object.values(inputs).forEach(input => {
            input.addEventListener('input', saveAllInputsToCookie);
        });

        // Modalidad de Escrutinio triggers visibility update
        modalidadSelect.addEventListener('change', updateCircuitosVisibility);

        // Attach NumberOfDays handler if field exists
        if (inputs["NumberOfDays"]) {
            inputs["NumberOfDays"].addEventListener('input', () => updateDayFieldsAndRestore());
            updateDayFieldsAndRestore(saved);
        }

        // Render descansos and circuitos after possible restore
        renderDescansos();
        renderCircuitos();
        updateCircuitosVisibility();

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
                config[field] = Number((inputs[field] as HTMLInputElement).value);
            }
            // Rounds
            config.rounds = {
                Entry: Number((inputs["rounds.Entry"] as HTMLInputElement).value),
                Development: Number((inputs["rounds.Development"] as HTMLInputElement).value),
                Professional: Number((inputs["rounds.Professional"] as HTMLInputElement).value),
            };
            // Dynamic days
            const numDays = Number((inputs["NumberOfDays"] as HTMLInputElement).value);
            for (let i = 1; i <= numDays; i++) {
                ["Start", "End"].forEach(part => {
                    const key = `Dia ${i} ${part}`;
                    config[key] = (inputs[key] as HTMLInputElement)?.value ?? '';
                });
            }
            // Descansos
            descansos.forEach(d => {
                if (d.name && d.start && d.end) {
                    config[`Descanso ${d.name} Start`] = d.start;
                    config[`Descanso ${d.name} End`] = d.end;
                }
            });
            // Dia de escrutinio
            config["Dia de Escrutinio"] = (inputs["Dia de Escrutinio"] as HTMLInputElement).value || undefined;
            // Modalidad de escrutinio
            config["Modalidad de Escrutinio"] = (inputs["Modalidad de Escrutinio"] as HTMLSelectElement).value;
            // Circuitos dinámicos only if desestructurado
            if (config["Modalidad de Escrutinio"] === "Desestructurado") {
                circuitos.forEach(c => {
                    if (c.fase && c.duracion !== '') {
                        config[`Duración Escrutinio Fase ${c.fase}`] = Number(c.duracion);
                    }
                });
            }
            form.remove();
            resolve(config as GlobalConfig);
        };

        document.body.appendChild(form);
        form.scrollIntoView({ behavior: 'smooth' });
    });
}
