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
    const descansos = generateDescansos(config)

    descansos.forEach(descanso => {
        assignGlobalEvent(descanso.name, descanso.start, descanso.duration, teams)
    })

    console.log("teams descanso", teams)

    /*
        Since the rest of the events will not be placed on top of previous ones,
        the best way to simulate multi day is by forcing the gaps between days to be occupied
        hence the scheduler will respect them and not put anything on top.
        The "Descanso" are removed after assigning the rest of the events and outputing excels
    */
    assignDescansos(windows, teams)

    const registroDurations = {
        Entry: config["Duración registro"],
        Development: config["Duración registro"],
        Professional: config["Duración registro"]
    };

    const endRegisterDate = assignSmallEvent(
        teams,
        windows[0][0],   // from Day 1 start
        startPrices,     // until just before the “startPrices” cutoff
        personelRegister,// how many counters in parallel
        registroDurations,
        "Registro"
    );


    // 3) The rest of your global events
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

    // 4) All the concurrent small events (Scrutiny, Portfolios, Verbal)
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

    console.log(teams, "finall")
}
