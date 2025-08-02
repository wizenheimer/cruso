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

/**
 * Export calendar tools
 */
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

/**
 * Export preference tools
 */
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

/**
 * Export all tools
 */
export const allTools = {
    ...calendarTools,
    ...preferenceTools,
    ...emailTools,
};
