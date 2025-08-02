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

export const thirdPartyCalendarTools = {
    createEvent,
    findBookableSlots,
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
