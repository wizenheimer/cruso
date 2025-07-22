import { z } from 'zod';
import { CalendarEvent } from '@/services/calendar/base';
import * as schemas from './events-schemas';

// ==================================================
// Derived TypeScript Types from Zod Schemas
// ==================================================

// Events Service Types
export type GetEventsOptions = z.infer<typeof schemas.getEventsOptionsSchema>;
export type GetEventsResult = z.infer<typeof schemas.getEventsResultSchema>;
export type GetEventsFromPrimaryCalendarResult = z.infer<
    typeof schemas.getEventsFromPrimaryCalendarResultSchema
>;
export type GetEventOptions = z.infer<typeof schemas.getEventOptionsSchema>;
export type GetEventFromPrimaryCalendarResult = z.infer<
    typeof schemas.getEventFromPrimaryCalendarResultSchema
>;
export type FindEventsByICalUIDOptions = z.infer<typeof schemas.findEventsByICalUIDOptionsSchema>;
export type GetUpdatedEventsOptions = z.infer<typeof schemas.getUpdatedEventsOptionsSchema>;
export type GetUpdatedEventsResult = z.infer<typeof schemas.getUpdatedEventsResultSchema>;
export type CreateEventOptions = z.infer<typeof schemas.createEventOptionsSchema>;
export type CreateEventInPrimaryCalendarResult = z.infer<
    typeof schemas.createEventInPrimaryCalendarResultSchema
>;
export type UpdateEventOptions = z.infer<typeof schemas.updateEventOptionsSchema>;
export type UpdateEventInPrimaryCalendarResult = z.infer<
    typeof schemas.updateEventInPrimaryCalendarResultSchema
>;
export type DeleteEventOptions = z.infer<typeof schemas.deleteEventOptionsSchema>;
export type DeleteEventFromPrimaryCalendarResult = z.infer<
    typeof schemas.deleteEventFromPrimaryCalendarResultSchema
>;
export type RescheduleEventOptions = z.infer<typeof schemas.rescheduleEventOptionsSchema>;
export type RescheduleEventInPrimaryCalendarResult = z.infer<
    typeof schemas.rescheduleEventInPrimaryCalendarResultSchema
>;
export type QuickCreateEventOptions = z.infer<typeof schemas.quickCreateEventOptionsSchema>;
export type QuickCreateEventInPrimaryCalendarResult = z.infer<
    typeof schemas.quickCreateEventInPrimaryCalendarResultSchema
>;
export type BatchOperation = z.infer<typeof schemas.batchOperationSchema>;
export type BatchOperationsOptions = z.infer<typeof schemas.batchOperationsOptionsSchema>;
export type BatchOperationResult = z.infer<typeof schemas.batchOperationResultSchema>;

// Event Reminder Types
export type EventReminder = z.infer<typeof schemas.eventReminderSchema>;

// Event Conference Types
export type ConferenceData = z.infer<typeof schemas.conferenceDataSchema>;

// Event Attendee Types
export type EventAttendee = z.infer<typeof schemas.eventAttendeeSchema>;

// Event Time Types
export type EventDateTime = z.infer<typeof schemas.eventDateTimeSchema>;

// Event Status Types
export type EventStatus = z.infer<typeof schemas.eventStatusSchema>;
export type EventTransparency = z.infer<typeof schemas.eventTransparencySchema>;

// Event Visibility Types
export type EventVisibility = z.infer<typeof schemas.eventVisibilitySchema>;

// Event Response Types
export type EventResponse = z.infer<typeof schemas.eventResponseSchema>;

// Event Filter Types
export type EventFilters = z.infer<typeof schemas.eventFiltersSchema>;

// Event Sync Types
export type EventSyncResult = z.infer<typeof schemas.eventSyncResultSchema>;
export type EventSyncOptions = z.infer<typeof schemas.eventSyncOptionsSchema>;

// Re-export schemas for runtime validation
export { schemas };
