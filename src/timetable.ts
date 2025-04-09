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

export function asignarHorarios(equipos: Equipo[], config: any, fechaInicio: Date): void {
    // 1. Asignar eventos previos a las carreras para cada equipo
    equipos.forEach((equipo, i) => {
        // Corregir: usar la clave correcta para el número de personal para el registro
        const personalRegistro = config["Nº de personal para el registro"];
        const regSlot = Math.floor(i / personalRegistro);
        const regStart = new Date(fechaInicio.getTime() + regSlot * 5 * 60000);
        const regEnd = new Date(regStart.getTime() + 5 * 60000);

        const charlaStart = new Date(regEnd.getTime());
        const charlaEnd = new Date(charlaStart.getTime() + 20 * 60000);

        const indivStart = new Date(charlaEnd.getTime());
        let indivDuration = 0;
        if (equipo.categoria === 'Entry') {
            indivDuration = 20 + 10 + 10 + 15;
        } else if (equipo.categoria === 'Development') {
            indivDuration = 20 + 20 + 15 + 15;
        } else { // Professional
            indivDuration = 25 + 20 + 15 + 15;
        }
        const indivEnd = new Date(indivStart.getTime() + indivDuration * 60000);

        let pitStart: Date | null = null;
        let pitEnd: Date | null = null;
        if (equipo.categoria === 'Development' || equipo.categoria === 'Professional') {
            pitStart = new Date(indivEnd.getTime());
            pitEnd = new Date(pitStart.getTime() + 65 * 60000);
        }
        const preRaceFinish = pitEnd ? pitEnd : indivEnd;

        const eventos: Evento[] = [];
        eventos.push({
            nombre: 'Registro',
            duracion: 5,
            inicio: regStart,
            fin: regEnd
        });
        eventos.push({
            nombre: 'Charla/Presentación',
            duracion: 20,
            inicio: charlaStart,
            fin: charlaEnd
        });
        const escrutinioDur = (equipo.categoria === 'Professional') ? 25 : 20;
        const escrutinioStart = new Date(indivStart.getTime());
        const escrutinioEnd = new Date(escrutinioStart.getTime() + escrutinioDur * 60000);
        eventos.push({
            nombre: 'Escrutinio',
            duracion: escrutinioDur,
            inicio: escrutinioStart,
            fin: escrutinioEnd
        });
        const presentacionDur = (equipo.categoria === 'Entry') ? 10 : 20;
        const presentacionStart = new Date(escrutinioEnd.getTime());
        const presentacionEnd = new Date(presentacionStart.getTime() + presentacionDur * 60000);
        eventos.push({
            nombre: 'Presentación verbal',
            duracion: presentacionDur,
            inicio: presentacionStart,
            fin: presentacionEnd
        });
        const portfolioTecDur = (equipo.categoria === 'Entry') ? 10 : 15;
        const portfolioTecStart = new Date(presentacionEnd.getTime());
        const portfolioTecEnd = new Date(portfolioTecStart.getTime() + portfolioTecDur * 60000);
        eventos.push({
            nombre: 'Portfolio Técnico',
            duracion: portfolioTecDur,
            inicio: portfolioTecStart,
            fin: portfolioTecEnd
        });
        const portfolioEmpDur = 15;
        const portfolioEmpStart = new Date(portfolioTecEnd.getTime());
        const portfolioEmpEnd = new Date(portfolioEmpStart.getTime() + portfolioEmpDur * 60000);
        eventos.push({
            nombre: 'Portfolio de Empresa',
            duracion: portfolioEmpDur,
            inicio: portfolioEmpStart,
            fin: portfolioEmpEnd
        });
        if (pitStart && pitEnd) {
            eventos.push({
                nombre: 'Montaje del Pit Display',
                duracion: 65,
                inicio: pitStart,
                fin: pitEnd
            });
        }

        equipo.horario = eventos;
        (equipo as any).preRaceFinish = preRaceFinish;
    });

    // 2. Calcular el inicio global de las carreras:
    const globalRaceStartTime = equipos.reduce((max, equipo) => {
        const finishTime = (equipo as any).preRaceFinish.getTime();
        return finishTime > max ? finishTime : max;
    }, 0);
    const globalRaceStart = new Date(globalRaceStartTime);

    // 3. Agregar carreras y ceremonia de clausura
    // Corregir: usar la clave correcta para las carreras clasificatorias
    const numCarreras = config["Nº de carreras clasificatorias"];
    // Si la propiedad para el tiempo de eliminatorias no existe, se asigna un valor por defecto (por ejemplo, 0)
    const tiempoEliminatorias = config.tiempoEliminatorias || 0;

    equipos.forEach(equipo => {
        let raceTime = new Date(globalRaceStart.getTime());

        for (let i = 1; i <= numCarreras; i++) {
            const raceStart = new Date(raceTime.getTime());
            const raceEnd = new Date(raceStart.getTime() + 10 * 60000);
            equipo.horario.push({
                nombre: `Carrera Clasificatoria ${i}`,
                duracion: 10,
                inicio: raceStart,
                fin: raceEnd
            });
            raceTime = new Date(raceEnd.getTime());
        }

        const reservaStart = new Date(raceTime.getTime());
        const reservaEnd = new Date(reservaStart.getTime() + tiempoEliminatorias * 60000);
        equipo.horario.push({
            nombre: 'Reserva Eliminatorias',
            duracion: tiempoEliminatorias,
            inicio: reservaStart,
            fin: reservaEnd
        });
        raceTime = new Date(reservaEnd.getTime());

        const ceremoniaStart = new Date(raceTime.getTime());
        const ceremoniaEnd = new Date(ceremoniaStart.getTime() + 90 * 60000);
        equipo.horario.push({
            nombre: 'Ceremonia de Clausura',
            duracion: 90,
            inicio: ceremoniaStart,
            fin: ceremoniaEnd
        });
    });
}
