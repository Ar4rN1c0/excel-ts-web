import { Equipo, GlobalConfig, Juez } from "../../types/types";
import { assignSmallEvent } from "./assignSmallEvent";

type judgesByCategory = {
    [k in "verbal" | "scrutiny" | "empresa" | "tecnico"]: Juez[]
}

export function assignPortfoliosAndVerbal(teams: Equipo[], start: Date, end: Date, config: GlobalConfig, judgesByCategory: judgesByCategory) {
    // Portfolio Técnico
    assignSmallEvent(
        teams,
        start,
        end,
        judgesByCategory.tecnico.length,
        {
            Development: config["Duración Portfolio Técnico Development"],
            Entry: config["Duración Portfolio Técnico Entry"],
            Professional: config["Duración Portfolio Técnico Professional"]
        },
        "Portfolio Técnico",
        {},
        false
    );
    // Portfolio de Empresa
    assignSmallEvent(
        teams,
        start,
        end,
        judgesByCategory.empresa.length,
        {
            Entry: config["Duración Portfolio Empresa Entry"],
            Development: config["Duración Portfolio Empresa Development"],
            Professional: config["Duración Portfolio Empresa Professional"]
        },
        "Portfolio de Empresa",
        {},
        false
    );
    // Presentación Verbal
    assignSmallEvent(
        teams,
        start,
        end,
        judgesByCategory.verbal.length,
        {
            Entry: config["Duración Presentación Verbal Entry"],
            Development: config["Duración Presentación Verbal Development"],
            Professional: config["Duración Presentación Verbal Professional"]
        },
        "Presentación Verbal",
        {},
        false
    );
}
