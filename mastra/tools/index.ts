import {
    createEvent,
    modifyEvent,
    cancelEvent,
    viewCalendarEvents,
    searchCalendarEvents,
    checkBusyStatus,
    initiateReschedulingOverEmailWithHostAndAttendees,
    initiateSchedulingOverEmailWithHostAndAttendees,
} from './event';
import { getSchedulingDefaults, updateSchedulingDefaults } from './preference';

export const calendarTools = {
    createEvent,
    modifyEvent,
    cancelEvent,
    viewCalendarEvents,
    searchCalendarEvents,
    checkBusyStatus,
    initiateReschedulingOverEmailWithHostAndAttendees,
    initiateSchedulingOverEmailWithHostAndAttendees,
};

export const thirdPartyCalendarTools = {
    checkBusyStatus,
    createEvent,
    modifyEvent,
    cancelEvent,
};

export const preferenceTools = {
    getSchedulingDefaults,
    updateSchedulingDefaults,
};

export const thirdPartyPreferenceTools = {
    getSchedulingDefaults,
};
