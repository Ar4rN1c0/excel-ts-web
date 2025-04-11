export interface Evento {
    nombre: string;
    duracion: number; // en minutos
    inicio?: Date;
    fin?: Date;
}

export interface Equipo {
    id: number;
    nombre: string;
    // La categoría es una de: 'Entry', 'Development' o 'Professional'
    categoria: 'Entry' | 'Development' | 'Professional';
    horario: Evento[];
}

export interface Juez {
    id: number;
    tipo: 'Portfolio Técnico' | 'Portfolio de Empresa' | 'Presentación verbal';
    horario: Evento[];
}

export function asignarHorarios(equipos: Equipo[], config: any, fechaInicio: Date): void {
    // 1. Registro: asignar slots individuales según el número de personal.
    const personalRegistro = config["Nº de personal para el registro"];
    equipos.forEach((equipo, index) => {
        const regSlot = Math.floor(index / personalRegistro);
        const regStart = new Date(fechaInicio.getTime() + regSlot * 5 * 60000);
        const regEnd = new Date(regStart.getTime() + 5 * 60000);
        equipo.horario.push({
            nombre: 'Registro',
            duracion: 5,
            inicio: regStart,
            fin: regEnd
        });
    });

    // 2. Calcular el fin global del Registro.
    const globalRegistrationFinishTime = equipos.reduce((max, equipo) => {
        const regEvent = equipo.horario.find(e => e.nombre === 'Registro');
        return regEvent && regEvent.fin && regEvent.fin.getTime() > max ? regEvent.fin.getTime() : max;
    }, 0);
    const globalRegistrationFinish = new Date(globalRegistrationFinishTime);

    // 3. Pausa de 20 minutos (Charla/Presentación) tras el último registro.
    const globalTalkStart = new Date(globalRegistrationFinish.getTime() + 20 * 60000);

    // 4. Ceremonia de Inauguración para todos los equipos (20 min)
    const globalInauguracionStart = new Date(globalTalkStart.getTime());
    const globalInauguracionEnd = new Date(globalInauguracionStart.getTime() + 20 * 60000);
    equipos.forEach(equipo => {
        equipo.horario.push({
            nombre: 'Ceremonia de Inauguración',
            duracion: 20,
            inicio: globalInauguracionStart,
            fin: globalInauguracionEnd
        });
    });
    // Guardamos en la configuración la hora global de inicio de evaluaciones.
    const globalEvalStart = globalInauguracionEnd;
    config.globalEvalStart = globalEvalStart;

    // 5. Evaluaciones individuales a partir de globalEvalStart.
    // Duraciones según categoría:
    //   • Entry: Escrutinio 20, Presentación verbal 10, Portfolio Técnico 10, Portfolio de Empresa 15 → Total 55 min.
    //   • Development: Escrutinio 20, Presentación verbal 20, Portfolio Técnico 15, Portfolio de Empresa 15 → Total 70 min.
    //   • Professional: Escrutinio 25, Presentación verbal 20, Portfolio Técnico 15, Portfolio de Empresa 15 → Total 75 min.
    equipos.forEach(equipo => {
        let currentStart = new Date(globalInauguracionEnd.getTime());
        const durations: { [key: string]: number } = {
            'Escrutinio': equipo.categoria === 'Professional' ? 25 : 20,
            'Presentación verbal': equipo.categoria === 'Entry' ? 10 : 20,
            'Portfolio Técnico': equipo.categoria === 'Entry' ? 10 : 15,
            'Portfolio de Empresa': 15
        };
        for (const actividad of ['Escrutinio', 'Presentación verbal', 'Portfolio Técnico', 'Portfolio de Empresa']) {
            const dur = durations[actividad];
            const inicio = new Date(currentStart.getTime());
            const fin = new Date(inicio.getTime() + dur * 60000);
            equipo.horario.push({
                nombre: actividad,
                duracion: dur,
                inicio,
                fin
            });
            currentStart = fin;
        }
        // Guardamos el fin de las evaluaciones individuales.
        (equipo as any).individualEnd = currentStart;
    });

    // Calcular el fin global de las evaluaciones individuales.
    const globalEvalEndTime = equipos.reduce((max, equipo) => {
        const teamEnd = (equipo as any).individualEnd.getTime();
        return teamEnd > max ? teamEnd : max;
    }, 0);
    const globalEvalEnd = new Date(globalEvalEndTime);

    // 6. Montaje del Pit Display:
    // Según los lineamientos, solo los equipos de Development y Professional realizan este evento.
    const equiposConPit = equipos.filter(e => e.categoria !== 'Entry');
    const globalPitDisplayStart = new Date(globalEvalEnd.getTime());
    const globalPitDisplayEnd = new Date(globalPitDisplayStart.getTime() + 65 * 60000);
    equiposConPit.forEach(equipo => {
        equipo.horario.push({
            nombre: 'Montaje del Pit Display',
            duracion: 65,
            inicio: globalPitDisplayStart,
            fin: globalPitDisplayEnd
        });
    });

    // 7. Fase Eliminatoria de Carreras:
    // Se consideran los equipos clasificados según el parámetro "Nº de equipos que se clasifican".
    const numCualificados = config["Nº de equipos que se clasifican"] || equipos.length;
    const equiposCualificados = equipos.slice(0, numCualificados);

    // Calcular el inicio global de las carreras:
    // - Para equipos Entry: se usa el fin de sus evaluaciones ((e as any).individualEnd).
    // - Para equipos con Pit Display: se usa el fin del Pit Display.
    // Se toma el máximo para que todos estén listos antes de iniciar carreras.
    const globalRaceStartTime = new Date(Math.max(
        ...equiposCualificados.map(e => 
            e.categoria === 'Entry' ? (e as any).individualEnd.getTime() : globalPitDisplayEnd.getTime()
        )
    ));

    // Iniciamos la asignación de carreras usando globalRaceStartTime.
    let raceStartTime = new Date(globalRaceStartTime.getTime());
    let globalRaceCounter = 1;

    // Las carreras se asignan agrupando por categoría, en el siguiente orden: Entry, Development y Professional.
    const categorias: ('Entry' | 'Development' | 'Professional')[] = ['Entry', 'Development', 'Professional'];
    for (const cat of categorias) {
        const equiposCat = equiposCualificados.filter(e => e.categoria === cat);
        for (let i = 0; i < equiposCat.length; i += 2) {
            if (i + 1 < equiposCat.length) {
                // Se forman parejas: ambos equipos comparten el mismo evento de carrera.
                const raceEvent = {
                    nombre: `Carrera Clasificatoria ${globalRaceCounter}`,
                    duracion: 10,
                    inicio: new Date(raceStartTime.getTime()),
                    fin: new Date(raceStartTime.getTime() + 10 * 60000)
                };
                equiposCat[i].horario.push(raceEvent);
                equiposCat[i + 1].horario.push(raceEvent);
                globalRaceCounter++;
                raceStartTime = new Date(raceEvent.fin.getTime());
            } else {
                // Si sólo queda un equipo, se le asigna un "bye" (evento individual).
                const raceEvent = {
                    nombre: `Carrera Clasificatoria ${globalRaceCounter} (bye)`,
                    duracion: 10,
                    inicio: new Date(raceStartTime.getTime()),
                    fin: new Date(raceStartTime.getTime() + 10 * 60000)
                };
                equiposCat[i].horario.push(raceEvent);
                globalRaceCounter++;
                raceStartTime = new Date(raceEvent.fin.getTime());
            }
        }
    }

    // 8. Eventos globales posteriores a las carreras.
    const tiempoEliminatorias = config["Tiempo Eliminatorias"] || 0;
    const reservaStart = new Date(raceStartTime.getTime());
    const reservaEnd = new Date(reservaStart.getTime() + tiempoEliminatorias * 60000);
    const reservaEvent = {
        nombre: 'Reserva Eliminatorias',
        duracion: tiempoEliminatorias,
        inicio: reservaStart,
        fin: reservaEnd
    };
    equipos.forEach(equipo => {
        equipo.horario.push({ ...reservaEvent });
    });

    raceStartTime = new Date(reservaEnd.getTime());
    const ceremoniaStart = new Date(raceStartTime.getTime());
    const ceremoniaEnd = new Date(ceremoniaStart.getTime() + 90 * 60000);
    const ceremoniaEvent = {
        nombre: 'Ceremonia de Clausura',
        duracion: 90,
        inicio: ceremoniaStart,
        fin: ceremoniaEnd
    };
    equipos.forEach(equipo => {
        equipo.horario.push({ ...ceremoniaEvent });
    });
}

export function asignarHorariosJueces(equipos: Equipo[], config: any, globalEvalStart: Date): Juez[] {
    // Se definen bloques globales para las evaluaciones.
    const tieneProfessional = equipos.some(e => e.categoria === 'Professional');
    const globalEscrutinioDuration = tieneProfessional ? 25 : 20;
    const presentacionDuration = 20;
    const portfolioTecnicoDuration = 15;
    const portfolioEmpresaDuration = 15;

    const globalPresentacionStart = new Date(globalEvalStart.getTime() + globalEscrutinioDuration * 60000);
    const globalPresentacionEnd = new Date(globalPresentacionStart.getTime() + presentacionDuration * 60000);
    const globalPortfolioTecnicoStart = new Date(globalPresentacionEnd.getTime());
    const globalPortfolioTecnicoEnd = new Date(globalPortfolioTecnicoStart.getTime() + portfolioTecnicoDuration * 60000);
    const globalPortfolioEmpresaStart = new Date(globalPortfolioTecnicoEnd.getTime());
    const globalPortfolioEmpresaEnd = new Date(globalPortfolioEmpresaStart.getTime() + portfolioEmpresaDuration * 60000);

    const jueces: Juez[] = [];
    const numJuecesPresentacion = config["Nº de Jueces para la presentación verbal"] || 0;
    for (let i = 1; i <= numJuecesPresentacion; i++) {
        jueces.push({
            id: i,
            tipo: 'Presentación verbal',
            horario: [{
                nombre: 'Evaluación de Presentación verbal',
                duracion: presentacionDuration,
                inicio: globalPresentacionStart,
                fin: globalPresentacionEnd
            }]
        });
    }
    const numJuecesPortfolioTec = config["Nº de Jueces para el portfolio técnico"] || 0;
    for (let i = 1; i <= numJuecesPortfolioTec; i++) {
        jueces.push({
            id: i,
            tipo: 'Portfolio Técnico',
            horario: [{
                nombre: 'Evaluación de Portfolio Técnico',
                duracion: portfolioTecnicoDuration,
                inicio: globalPortfolioTecnicoStart,
                fin: globalPortfolioTecnicoEnd
            }]
        });
    }
    const numJuecesPortfolioEmp = config["Nº de Jueces para el portfolio de empresa"] || 0;
    for (let i = 1; i <= numJuecesPortfolioEmp; i++) {
        jueces.push({
            id: i,
            tipo: 'Portfolio de Empresa',
            horario: [{
                nombre: 'Evaluación de Portfolio de Empresa',
                duracion: portfolioEmpresaDuration,
                inicio: globalPortfolioEmpresaStart,
                fin: globalPortfolioEmpresaEnd
            }]
        });
    }
    return jueces;
}
