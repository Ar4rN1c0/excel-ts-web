import { GlobalConfig } from "../../types/types";

export type Descanso = { name: string; start: Date; duration: number };

export function generateDescansos(config: GlobalConfig): Descanso[] {
    const descansoNames = Object.keys(config)
        .filter(key => key.startsWith("Descanso ") && key.endsWith(" Start"))
        .map(key => key.slice(9, -6).trim());

    return descansoNames.map(name => {
        const startKey = `Descanso ${name} Start`;
        const endKey = `Descanso ${name} End`;
        const start = new Date((config as Record<string, any>)[startKey]);
        const end = (config as Record<string, any>)[endKey];

        // Calculate duration in minutes (assuming ISO string format)
        let duration = 0;
        if (start && end) {
            const startDate = new Date(start);
            const endDate = new Date(end);
            duration = (endDate.getTime() - startDate.getTime()) / 60000; // milliseconds to minutes
        }

        return {
            name,
            start,
            duration
        };
    }).filter(descanso => descanso.start && descanso.duration > 0);
}
