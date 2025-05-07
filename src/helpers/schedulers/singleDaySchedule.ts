import { Equipo, Juez } from "../../types/types";
import { assignClassificatoryRaces } from "../assigners/assignClassificatoryRaces";
import { assignGlobalEvent } from "../assigners/assignGlobal";
import { assignRegisters } from "../assigners/assignRegisters";
import { assignScrutiny } from "../assigners/assignScrutiny";
import { assignSmallEvent } from "../assigners/assignSmallevent";
import { mins } from "../math";

export function singleDaySchedule(
    teams: Equipo[],
    startDate: Date,
    endDate: Date,
    judgesVerbal: Juez[],
    judgesScrutiny: Juez[],
    judgesPortfolioEmpresa: Juez[],
    judgesPortfolioTecnico: Juez[],
    personelRegister: number,
    config: any
) {
    const startPrices = new Date(endDate.getTime() - mins(90));

    const endRegisterDate = assignRegisters(startDate, 5, teams, personelRegister) as Date;
    
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

    assignScrutiny(
        teams,
        new Date(endRegisterDate.getTime() + mins(20)),
        startPrices,
        judgesScrutiny.length,
        {
            Development: config["Duración Escrutinio Development"],
            Entry: config["Duración Escrutinio Entry"],
            Professional: config["Duración Escrutinio Professional"]
        }
    );

    assignClassificatoryRaces(teams, {
        duration: 10,
        heatsPerCategory: {
            Entry: { max: config["Carreras Entry"], min: config["Carreras Entry"] },
            Development: { max: 2, min: 2 },
            Professional: { max: 2, min: 2 }
        }
    });

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
