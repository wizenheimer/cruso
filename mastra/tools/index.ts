import {
    updateEventTool,
    listEventsTool,
    createEventTool,
    deleteEventTool,
    getAvailabilityTool,
    searchEventsTool,
    findAvailabilitySlotsTool,
} from './event';
import { getPreferencesTool, setPreferencesTool } from './preference';

export const calendarTools = {
    updateEventTool,
    listEventsTool,
    createEventTool,
    deleteEventTool,
    getAvailabilityTool,
    searchEventsTool,
    findAvailabilitySlotsTool,
};

export const preferenceTools = {
    getPreferencesTool,
    setPreferencesTool,
};
