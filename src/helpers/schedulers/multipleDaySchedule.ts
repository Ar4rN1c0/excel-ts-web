import { Equipo, GlobalConfig, Juez } from "../../types/types";
import { assignClassificatoryRaces } from "../assigners/assignClassificatoryRaces";
import { assignGlobalEvent } from "../assigners/assignGlobal";
import { assignSmallEvent } from "../assigners/assignSmallevent";
import { mins } from "../math/math";

export function multipleDaySchedule(
    teams: Equipo[],
    windows: Date[][],
    judgesVerbal: Juez[],
    judgesScrutiny: Juez[],
    judgesPortfolioEmpresa: Juez[],
    judgesPortfolioTecnico: Juez[],
    personelRegister: number,
    config: GlobalConfig
) {
    const numOfDays = config.NumberOfDays;
    // time by which ALL registration _and_ small events must finish:
    const startPrices = new Date(
        windows[numOfDays - 1][1].getTime() - mins(90)
    );

    // 1) Pre‐seed all the “Descanso” slots _first_ (so they’re in every team.horario)
    for (let i = 0; i < windows.length - 1; i++) {
        const endCurrent = windows[i][1];
        const startNext = windows[i + 1][0];
        if (endCurrent < startNext) {
            assignGlobalEvent(
                "Descanso",
                endCurrent,
                (startNext.getTime() - endCurrent.getTime()) / 60000,
                teams
            );
        }
    }

    // 2) Now schedule _all_ the 5-minute “Registro” slots into whatever gaps remain—
    //    spanning from the very first window’s start up to startPrices.
    const registroDurations = {
        Entry: 5,
        Development: 5,
        Professional: 5
    };

    const endRegisterDate = assignSmallEvent(
        teams,
        windows[0][0],   // from Day 1 start
        startPrices,     // until just before the “startPrices” cutoff
        personelRegister,// how many counters in parallel
        registroDurations,
        "Registro"
    ) as Date;


    // 3) The rest of your global events
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
        duration: 10,
        heatsPerCategory: {
            Entry: { max: config["Carreras Entry"], min: config["Carreras Entry"] },
            Development: { max: 2, min: 2 },
            Professional: { max: 2, min: 2 }
        },
    }, startPrices);

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

    // 5) Finally, closing ceremony
    assignGlobalEvent(
        "Ceremonia de Clausura y Premios",
        startPrices,
        config["Duración Ceremonia de Clausura y Premios"],
        teams
    );
}
