import {
    updateEventTool,
    listEventsTool,
    createEventTool,
    deleteEventTool,
    getAvailabilityTool,
    searchEventsTool,
} from './event';
import { getPreferencesTool, setPreferencesTool } from './preference';

export const calendarTools = {
    updateEventTool,
    listEventsTool,
    createEventTool,
    deleteEventTool,
    getAvailabilityTool,
    searchEventsTool,
};

export const preferenceTools = {
    getPreferencesTool,
    setPreferencesTool,
};
