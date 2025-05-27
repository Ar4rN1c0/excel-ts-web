import { Equipo, GlobalConfig, Juez } from "../../types/types";
import { assignClassificatoryRaces } from "../assigners/assignClassificatoryRaces";
import { assignGlobalEvent } from "../assigners/assignGlobal";
import { assignSmallEvent } from "../assigners/assignSmallEvent";
import { mins } from "../math/math";

export function singleDaySchedule(
    teams: Equipo[],
    startDate: Date,
    endDate: Date,
    judgesVerbal: Juez[],
    judgesScrutiny: Juez[],
    judgesPortfolioEmpresa: Juez[],
    judgesPortfolioTecnico: Juez[],
    personelRegister: number,
    config: GlobalConfig
) {
    const startPrices = new Date(endDate.getTime() - mins(90));
    const registroDurations = {
        Entry: config["Duración registro"],
        Development: config["Duración registro"],
        Professional: config["Duración registro"]
    };

    const endRegisterDate = assignSmallEvent(
        teams,
        startDate,   // from Day 1 start
        startPrices,     // until just before the “startPrices” cutoff
        personelRegister,// how many counters in parallel
        registroDurations,
        "Registro"
    );

    const endCharla = assignGlobalEvent(
        "Charla/Presentación",
        endRegisterDate,
        config["Duración Charla/Presentación"],
        teams
    ) as Date;

    const endPitDisplay = assignGlobalEvent(
        "Pit Display",
        endCharla,
        config["Duración Montaje del Pit Display"],
        teams
    ) as Date;
    console.log("Eeeooo")

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
        {
            Entry: 0,
        }
    );

    assignClassificatoryRaces(teams, {
        duration: {
            Development: 10,
            Entry: 10,
            Professional: 10
        },
        heatsPerCategory: {
            Entry: { max: config["Carreras Entry"], min: config["Carreras Entry"] },
            Development: { max: 2, min: 2 },
            Professional: { max: 2, min: 2 }
        }
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
            "Portfolio de empresa"
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
