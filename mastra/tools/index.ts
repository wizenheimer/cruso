import {
    updateEventTool,
    listEventsTool,
    createEventTool,
    deleteEventTool,
    getAvailabilityTool,
    searchEventsTool,
    findAvailabilitySlotsTool,
    requestReschedulingForEventTool,
    requestSchedulingForEventTool,
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
    requestReschedulingForEventTool,
    requestSchedulingForEventTool,
};

export const thirdPartyCalendarTools = {
    findAvailabilitySlotsTool,
    createEventTool,
    updateEventTool,
};

export const preferenceTools = {
    getPreferencesTool,
    setPreferencesTool,
};

export const thirdPartyPreferenceTools = {
    getPreferencesTool,
};
