import {
    createEventInPrimaryCalendarToolSchema,
    createEventToolSchema,
    deleteEventInPrimaryCalendarToolSchema,
    deleteEventToolSchema,
    freeBusyIncludeCalendarsSchema,
    freeBusyOmitCalendarsSchema,
    listEventsFromPrimaryCalendarToolSchema,
    listEventsToolSchema,
    requestReschedulingInPrimaryCalendarToolSchema,
    requestReschedulingToolSchema,
    requestSchedulingInPrimaryCalendarToolSchema,
    requestSchedulingToolSchema,
    searchEventsFromPrimaryCalendarToolSchema,
    searchEventsToolSchema,
    slotSuggestionToolSchema,
    slotSuggestionToolSchemaIncludeCalendars,
    updateEventInPrimaryCalendarToolSchema,
    updateEventToolSchema,
} from '@/schema/tools/event';
import { z } from 'zod';

export type ListEventsFromPrimaryCalendarOptions = z.infer<
    typeof listEventsFromPrimaryCalendarToolSchema
>;

export type ListEventsFromAnyCalendarOptions = z.infer<typeof listEventsToolSchema>;

export type SearchEventsFromPrimaryCalendarOptions = z.infer<
    typeof searchEventsFromPrimaryCalendarToolSchema
>;

export type SearchEventsFromAnyCalendarOptions = z.infer<typeof searchEventsToolSchema>;

export type CreateEventInPrimaryCalendarOptions = z.infer<
    typeof createEventInPrimaryCalendarToolSchema
>;

export type CreateEventFromAnyCalendarOptions = z.infer<typeof createEventToolSchema>;

export type UpdateEventInPrimaryCalendarOptions = z.infer<
    typeof updateEventInPrimaryCalendarToolSchema
>;

export type UpdateEventFromAnyCalendarOptions = z.infer<typeof updateEventToolSchema>;

export type DeleteEventInPrimaryCalendarOptions = z.infer<
    typeof deleteEventInPrimaryCalendarToolSchema
>;

export type DeleteEventFromAnyCalendarOptions = z.infer<typeof deleteEventToolSchema>;

export type FreeBusyOmitCalendarsOptions = z.infer<typeof freeBusyOmitCalendarsSchema>;

export type FreeBusyIncludeCalendarsOptions = z.infer<typeof freeBusyIncludeCalendarsSchema>;

export type SlotSuggestionOptionsExcludeCalendars = z.infer<typeof slotSuggestionToolSchema>;

export type SlotSuggestionOptionsIncludeCalendars = z.infer<
    typeof slotSuggestionToolSchemaIncludeCalendars
>;

export type RequestReschedulingOptions = z.infer<typeof requestReschedulingToolSchema>;

export type RequestReschedulingInPrimaryCalendarOptions = z.infer<
    typeof requestReschedulingInPrimaryCalendarToolSchema
>;

export type SchedulingOptions = z.infer<typeof requestSchedulingToolSchema>;

export type SchedulingInPrimaryCalendarOptions = z.infer<
    typeof requestSchedulingInPrimaryCalendarToolSchema
>;
