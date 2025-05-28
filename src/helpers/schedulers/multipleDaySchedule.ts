import { Equipo, GlobalConfig, Juez } from "../../types/types";
import { assignClassificatoryRaces } from "../assigners/assignClassificatoryRaces";
import { assignDescansos } from "../assigners/assignDescansos";
import { assignGlobalEvent } from "../assigners/assignGlobal";
import { assignSmallEvent } from "../assigners/assignSmallEvent";
import { generateDescansos } from "../generators/generateDescansos";
import { mins } from "../math/math";

export const multipleDaySchedule = (
    teams: Equipo[],
    windows: Date[][],
    judgesVerbal: Juez[],
    judgesScrutiny: Juez[],
    judgesPortfolioEmpresa: Juez[],
    judgesPortfolioTecnico: Juez[],
    personelRegister: number,
    config: GlobalConfig
) => {
    const numOfDays = config.NumberOfDays;

    const startPrices = new Date(
        windows[numOfDays - 1][1].getTime() - mins(90)
    );
    const descansos = generateDescansos(config);

    descansos.forEach(descanso => {
        assignGlobalEvent(descanso.name, descanso.start, descanso.duration, teams)
    });
    assignDescansos(windows, teams);

    const registroDurations = {
        Entry: config["Duración registro"],
        Development: config["Duración registro"],
        Professional: config["Duración registro"]
    };

    if (config["Dia de Escrutinio"]) {
        // =============== DAY 1: Registro & Escrutinio Only ==================
        const day1Start = windows[0][0];
        const day1End = windows[0][1];

        const endRegisterDate = assignSmallEvent(
            teams,
            day1Start,
            day1End,
            personelRegister,
            registroDurations,
            "Registro"
        );

        assignSmallEvent(
            teams,
            endRegisterDate,
            day1End,
            judgesScrutiny.length,
            {
                Development: config["Duración Escrutinio Development"],
                Entry: config["Duración Escrutinio Entry"],
                Professional: config["Duración Escrutinio Professional"]
            },
            "Escrutinio",
            { Entry: 0 }
        );

        // =============== DAY 2+: Charla, Pit Display, THEN Everything Else ===
        if (windows.length < 2) {
            throw new Error("Se requiere al menos dos días para Dia de Escrutinio.");
        }

        // Start events on day 2
        const day2Start = windows[1][0];

        // 1) Charla/Presentación
        const endCharla = assignGlobalEvent(
            "Charla/Presentación",
            day2Start,
            config["Duración Charla/Presentación"],
            teams
        );

        // 2) Pit Display (immediately after Charla)
        const endPitDisplay = assignGlobalEvent(
            "Pit Display",
            endCharla,
            config["Duración Montaje del Pit Display"],
            teams
        );

        // 3) Classificatory races, portfolios, verbal PRESENTATIONS after Pit Display until 'startPrices'
        assignClassificatoryRaces(teams, {
            duration: {
                Entry: config["Duración Carrera Entry"],
                Development: config["Duración Carrera Development"],
                Professional: config["Duración Carrera Professional"]
            },
            heatsPerCategory: {
                Entry: { max: config["Carreras Entry"], min: config["Carreras Entry"] },
                Development: { max: 2, min: 2 },
                Professional: { max: 2, min: 2 }
            },
        }, endPitDisplay, startPrices, config["Nº de carreras a la vez"]);

        try {
            assignSmallEvent(
                teams,
                endPitDisplay,
                startPrices,
                judgesPortfolioTecnico.length,
                {
                    Development: config["Duración Portfolio Técnico Development"],
                    Entry: config["Duración Portfolio Técnico Entry"],
                    Professional: config["Duración Portfolio Técnico Professional"]
                },
                "Portfolio Técnico"
            );

            assignSmallEvent(
                teams,
                endPitDisplay,
                startPrices,
                judgesPortfolioEmpresa.length,
                {
                    Entry: config["Duración Portfolio Empresa Entry"],
                    Development: config["Duración Portfolio Empresa Development"],
                    Professional: config["Duración Portfolio Empresa Professional"]
                },
                "Portfolio de Empresa"
            );

            assignSmallEvent(
                teams,
                endPitDisplay,
                startPrices,
                judgesVerbal.length,
                {
                    Entry: config["Duración Presentación Verbal Entry"],
                    Development: config["Duración Presentación Verbal Development"],
                    Professional: config["Duración Presentación Verbal Professional"]
                },
                "Presentación Verbal"
            );
        } catch (error) {
            console.error(error);
        }

        // 4) Closing Ceremony at the end
        assignGlobalEvent(
            "Ceremonia de Clausura y Premios",
            startPrices,
            config["Duración Ceremonia de Clausura y Premios"],
            teams
        );

    } else {
        // =============== STANDARD MULTI-DAY (NO SCRUTINIO DAY) ==============
        const endRegisterDate = assignSmallEvent(
            teams,
            windows[0][0],
            startPrices,
            personelRegister,
            registroDurations,
            "Registro"
        );

        const endCharla = assignGlobalEvent(
            "Charla/Presentación",
            endRegisterDate,
            config["Duración Charla/Presentación"],
            teams
        );

        const endPitDisplay = assignGlobalEvent(
            "Pit Display",
            endCharla,
            config["Duración Montaje del Pit Display"],
            teams
        );

        assignSmallEvent(
            teams,
            endRegisterDate,
            startPrices,
            judgesScrutiny.length,
            {
                Development: config["Duración Escrutinio Development"],
                Entry: config["Duración Escrutinio Entry"],
                Professional: config["Duración Escrutinio Professional"]
            },
            "Escrutinio",
            { Entry: 0 }
        );

        assignClassificatoryRaces(teams, {
            duration: {
                Entry: config["Duración Carrera Entry"],
                Development: config["Duración Carrera Development"],
                Professional: config["Duración Carrera Professional"]
            },
            heatsPerCategory: {
                Entry: { max: config["Carreras Entry"], min: config["Carreras Entry"] },
                Development: { max: 2, min: 2 },
                Professional: { max: 2, min: 2 }
            },
        }, endPitDisplay, startPrices, config["Nº de carreras a la vez"]);

        try {
            assignSmallEvent(
                teams,
                endPitDisplay,
                startPrices,
                judgesPortfolioTecnico.length,
                {
                    Development: config["Duración Portfolio Técnico Development"],
                    Entry: config["Duración Portfolio Técnico Entry"],
                    Professional: config["Duración Portfolio Técnico Professional"]
                },
                "Portfolio Técnico"
            );

            assignSmallEvent(
                teams,
                endPitDisplay,
                startPrices,
                judgesPortfolioEmpresa.length,
                {
                    Entry: config["Duración Portfolio Empresa Entry"],
                    Development: config["Duración Portfolio Empresa Development"],
                    Professional: config["Duración Portfolio Empresa Professional"]
                },
                "Portfolio de Empresa"
            );

            assignSmallEvent(
                teams,
                endPitDisplay,
                startPrices,
                judgesVerbal.length,
                {
                    Entry: config["Duración Presentación Verbal Entry"],
                    Development: config["Duración Presentación Verbal Development"],
                    Professional: config["Duración Presentación Verbal Professional"]
                },
                "Presentación Verbal"
            );
        } catch (error) {
            console.error(error);
        }

        assignGlobalEvent(
            "Ceremonia de Clausura y Premios",
            startPrices,
            config["Duración Ceremonia de Clausura y Premios"],
            teams
        );
    }

    console.log(teams, "final");
};
