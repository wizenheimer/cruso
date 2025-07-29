import {
    createEventInPrimaryCalendarToolSchema,
    createEventToolSchema,
    viewCalendarEventsFromPrimaryCalendarToolSchema,
    viewCalendarEventsToolSchema,
    searchCalendarEventsToolSchema,
    searchCalendarEventsFromPrimaryCalendarToolSchema,
    modifyEventToolSchema,
    modifyEventInPrimaryCalendarToolSchema,
    cancelEventToolSchema,
    cancelEventInPrimaryCalendarToolSchema,
    initiateReschedulingOverEmailInPrimaryCalendarToolSchema,
    initiateSchedulingOverEmailInPrimaryCalendarToolSchema,
    initiateReschedulingOverEmailToolSchema,
    initiateSchedulingOverEmailToolSchema,
    checkBusyStatusToolSchema,
    findBookableSlotsIncludeCalendarsSchema,
    checkBusyStatusIncludeCalendarsSchema,
    findBookableSlotsToolSchema,
} from '@/schema/tools/event';
import { z } from 'zod';

export type ListEventsFromPrimaryCalendarOptions = z.infer<
    typeof viewCalendarEventsFromPrimaryCalendarToolSchema
>;

export type ListEventsFromAnyCalendarOptions = z.infer<typeof viewCalendarEventsToolSchema>;

export type SearchEventsFromPrimaryCalendarOptions = z.infer<
    typeof searchCalendarEventsFromPrimaryCalendarToolSchema
>;

export type SearchEventsFromAnyCalendarOptions = z.infer<typeof searchCalendarEventsToolSchema>;

export type CreateEventInPrimaryCalendarOptions = z.infer<
    typeof createEventInPrimaryCalendarToolSchema
>;

export type CreateEventFromAnyCalendarOptions = z.infer<typeof createEventToolSchema>;

export type UpdateEventInPrimaryCalendarOptions = z.infer<
    typeof modifyEventInPrimaryCalendarToolSchema
>;

export type UpdateEventFromAnyCalendarOptions = z.infer<typeof modifyEventToolSchema>;

export type DeleteEventInPrimaryCalendarOptions = z.infer<
    typeof cancelEventInPrimaryCalendarToolSchema
>;

export type DeleteEventFromAnyCalendarOptions = z.infer<typeof cancelEventToolSchema>;

export type FreeBusyOmitCalendarsOptions = z.infer<typeof checkBusyStatusToolSchema>;

export type FreeBusyIncludeCalendarsOptions = z.infer<typeof checkBusyStatusIncludeCalendarsSchema>;

export type SlotSuggestionOptionsExcludeCalendars = z.infer<typeof findBookableSlotsToolSchema>;

export type SlotSuggestionOptionsIncludeCalendars = z.infer<
    typeof findBookableSlotsIncludeCalendarsSchema
>;

export type RequestReschedulingOptions = z.infer<typeof initiateReschedulingOverEmailToolSchema>;

export type RequestReschedulingInPrimaryCalendarOptions = z.infer<
    typeof initiateReschedulingOverEmailInPrimaryCalendarToolSchema
>;

export type SchedulingOptions = z.infer<typeof initiateSchedulingOverEmailToolSchema>;

export type SchedulingInPrimaryCalendarOptions = z.infer<
    typeof initiateSchedulingOverEmailInPrimaryCalendarToolSchema
>;
