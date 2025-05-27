import { State } from "../../types/types";

export const saveStateToStorage = (state: State, name?: string) => {
    try {
        const data = JSON.stringify(state);
        localStorage.setItem(("Schedule: " + name) || ("schedule_config " + new Date().toLocaleString()), data);
        console.log("Successfully stored current data in localStorage.");
    } catch (error) {
        console.error("Failed to store data in localStorage:", error);
    }

    const storedData = localStorage.getItem("schedule_config");
    if (storedData) {
        console.log("Retrieved from localStorage:", JSON.parse(storedData));
    } else {
        console.warn("No data found in localStorage under 'schedule_config'.");
    }

};
