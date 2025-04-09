export interface Evento {
    nombre: string;
    duracion: number; // en minutos
    inicio?: Date;
    fin?: Date;
}

export interface Equipo {
    id: number;
    nombre: string;
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

    // 3. Charla/Presentación Global: 20 minutos para todos los equipos, tras finalizar el registro.
    const globalCharlaStart = globalRegistrationFinish;
    const globalCharlaEnd = new Date(globalCharlaStart.getTime() + 20 * 60000);
    equipos.forEach(equipo => {
        equipo.horario.push({
            nombre: 'Charla/Presentación Global',
            duracion: 20,
            inicio: globalCharlaStart,
            fin: globalCharlaEnd
        });
    });
    // Guardamos en la configuración la hora global de inicio de evaluaciones (después de la charla).
    config.globalEvalStart = globalCharlaEnd;

    // 4. Evaluaciones individuales a partir de globalEvalStart.
    // Duraciones según categoría:
    // Entry: Escrutinio 20, Presentación verbal 10, Portfolio Técnico 10, Portfolio de Empresa 15 → Total 55 min
    // Development: Escrutinio 20, Presentación verbal 20, Portfolio Técnico 15, Portfolio de Empresa 15 → Total 70 min
    // Professional: Escrutinio 25, Presentación verbal 20, Portfolio Técnico 15, Portfolio de Empresa 15 → Total 75 min
    equipos.forEach(equipo => {
        let currentStart = new Date(globalCharlaEnd.getTime());
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
        // Se guarda el fin de las evaluaciones individuales para cada equipo.
        (equipo as any).individualEnd = currentStart;
    });

    // 5. Calcular el fin global de las evaluaciones individuales.
    const globalEvalEndTime = equipos.reduce((max, equipo) => {
        const teamEnd = (equipo as any).individualEnd.getTime();
        return teamEnd > max ? teamEnd : max;
    }, 0);
    const globalEvalEnd = new Date(globalEvalEndTime);

    // 6. Montaje del Pit Display (global para equipos Development y Professional).
    let globalPitDisplayStart: Date | null = null;
    let globalPitDisplayEnd: Date | null = null;
    const tienePitDisplay = equipos.some(e => e.categoria === 'Development' || e.categoria === 'Professional');
    if (tienePitDisplay) {
        globalPitDisplayStart = globalEvalEnd;
        globalPitDisplayEnd = new Date(globalPitDisplayStart.getTime() + 65 * 60000);
        equipos.forEach(equipo => {
            if (equipo.categoria === 'Development' || equipo.categoria === 'Professional') {
                equipo.horario.push({
                    nombre: 'Montaje del Pit Display',
                    duracion: 65,
                    inicio: globalPitDisplayStart!,
                    fin: globalPitDisplayEnd!
                });
            }
        });
    }

    // 7. Bloque global de Carreras.
    const globalRaceStart = globalPitDisplayEnd ? globalPitDisplayEnd : globalEvalEnd;
    let raceTime = new Date(globalRaceStart.getTime());
    const numCarreras = config["Nº de carreras clasificatorias"] || 0;
    const globalRaceEvents: Evento[] = [];
    for (let i = 1; i <= numCarreras; i++) {
        const raceStart = new Date(raceTime.getTime());
        const raceEnd = new Date(raceStart.getTime() + 10 * 60000);
        globalRaceEvents.push({
            nombre: `Carrera Clasificatoria ${i}`,
            duracion: 10,
            inicio: raceStart,
            fin: raceEnd
        });
        raceTime = new Date(raceEnd.getTime());
    }
    const tiempoEliminatorias = config["Tiempo Eliminatorias"] || 0;
    const reservaStart = new Date(raceTime.getTime());
    const reservaEnd = new Date(reservaStart.getTime() + tiempoEliminatorias * 60000);
    globalRaceEvents.push({
        nombre: 'Reserva Eliminatorias',
        duracion: tiempoEliminatorias,
        inicio: reservaStart,
        fin: reservaEnd
    });
    raceTime = new Date(reservaEnd.getTime());
    const ceremoniaStart = new Date(raceTime.getTime());
    const ceremoniaEnd = new Date(ceremoniaStart.getTime() + 90 * 60000);
    globalRaceEvents.push({
        nombre: 'Ceremonia de Clausura',
        duracion: 90,
        inicio: ceremoniaStart,
        fin: ceremoniaEnd
    });
    // Se agregan los eventos globales de carreras a cada equipo.
    equipos.forEach(equipo => {
        globalRaceEvents.forEach(evento => {
            equipo.horario.push({ ...evento });
        });
    });
}

export function asignarHorariosJueces(equipos: Equipo[], config: any, globalEvalStart: Date): Juez[] {
    // Se determinan bloques globales para la evaluación de Presentación, Portfolio Técnico y Portfolio de Empresa.
    const tieneProfessional = equipos.some(e => e.categoria === 'Professional');
    const globalEscrutinioDuration = tieneProfessional ? 25 : 20;
    const presentacionDuration = 20; // máximo para presentación
    const portfolioTecnicoDuration = 15;
    const portfolioEmpresaDuration = 15;

    // Definir bloques para cada evaluación (basados en el peor caso para cubrir a todos los equipos).
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
