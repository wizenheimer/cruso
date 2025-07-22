import { z } from 'zod';
import type { CalendarEvent } from './base';
import type {
    EventReminder,
    EventAttendee,
    EventDateTime,
    EventStatus,
    EventTransparency,
    EventVisibility,
} from './shared';
import * as schemas from './events-schemas';

// ==================================================
// Derived TypeScript Types from Zod Schemas
// ==================================================

// Events Service Types
export type ListEventsOptions = z.infer<typeof schemas.listEventsOptionsSchema>;
export type GetEventsResult = z.infer<typeof schemas.getEventsResultSchema>;
export type ListEventsFromPrimaryCalendarResult = z.infer<
    typeof schemas.listEventsFromPrimaryCalendarResultSchema
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

// Event Response Types
export type EventResponse = z.infer<typeof schemas.eventResponseSchema>;

// Event Filter Types
export type EventFilters = z.infer<typeof schemas.eventFiltersSchema>;

// Event Sync Types
export type EventSyncResult = z.infer<typeof schemas.eventSyncResultSchema>;
export type EventSyncOptions = z.infer<typeof schemas.eventSyncOptionsSchema>;

// Re-export shared types for convenience
export type {
    EventReminder,
    EventAttendee,
    EventDateTime,
    EventStatus,
    EventTransparency,
    EventVisibility,
} from './shared';

// Schemas are re-exported from the index file
