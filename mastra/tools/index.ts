import {
    createEvent,
    modifyEvent,
    cancelEvent,
    viewCalendarEvents,
    searchCalendarEvents,
    checkBusyStatus,
    initiateReschedulingOverEmailWithHostAndAttendees,
    initiateSchedulingOverEmailWithHostAndAttendees,
    findBookableSlots,
} from './event';
import { getSchedulingDefaults, updateSchedulingDefaults } from './preference';
import { validateEmailHTMLTool } from './email';

export const calendarTools = {
    createEvent,
    modifyEvent,
    cancelEvent,
    viewCalendarEvents,
    searchCalendarEvents,
    checkBusyStatus,
    findBookableSlots,
    initiateReschedulingOverEmailWithHostAndAttendees,
    initiateSchedulingOverEmailWithHostAndAttendees,
};

export const preferenceTools = {
    getSchedulingDefaults,
    updateSchedulingDefaults,
};

/**
 * Export the focused HTML validation tool
 */
export const emailTools = {
    validateEmailHTMLTool,
};
