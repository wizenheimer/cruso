import { z } from 'zod';
import {
    eventStatusSchema,
    eventTransparencySchema,
    eventVisibilitySchema,
    reminderMethodSchema,
    attendeeResponseStatusSchema,
    eventReminderSchema,
    eventAttendeeSchema,
    eventDateTimeSchema,
} from './shared';
import { calendarEventSchema } from './base';

// ==================================================
// Base Zod Schemas
// ==================================================

export const sendUpdatesSchema = z.enum(['all', 'externalOnly', 'none']);
export const orderBySchema = z.enum(['startTime', 'updated']);

// Re-export shared schemas for convenience
export {
    eventStatusSchema,
    eventTransparencySchema,
    eventVisibilitySchema,
    reminderMethodSchema,
    attendeeResponseStatusSchema,
    eventReminderSchema,
    eventAttendeeSchema,
    eventDateTimeSchema,
} from './shared';

// ==================================================
// Event Options Schemas
// ==================================================

export const listEventsOptionsSchema = z.object({
    // Time range
    timeMin: z.string().optional(),
    timeMax: z.string().optional(),

    // Pagination and limits
    maxResults: z.number().min(1).max(2500).optional(),
    pageToken: z.string().optional(),

    // Search and filtering
    q: z.string().optional(),
    iCalUID: z.string().optional(),

    // Event display options
    showDeleted: z.boolean().optional(),
    singleEvents: z.boolean().optional(),
    orderBy: orderBySchema.optional(),

    // Time and timezone
    timeZone: z.string().optional(),

    // Attendee options
    alwaysIncludeEmail: z.boolean().optional(),
    maxAttendees: z.number().min(1).max(100).optional(),

    // Sync options
    syncToken: z.string().optional(),

    // Additional filters
    updatedMin: z.string().optional(),
});

export const getEventOptionsSchema = z.object({
    eventId: z.string(),
    timeZone: z.string().optional(),
    alwaysIncludeEmail: z.boolean().optional(),
    maxAttendees: z.number().min(1).max(100).optional(),
});

export const findEventsByICalUIDOptionsSchema = z.object({
    timeZone: z.string().optional(),
    includeDeleted: z.boolean().optional(),
});

export const getUpdatedEventsOptionsSchema = z.object({
    maxResults: z.number().min(1).max(2500).optional(),
    pageToken: z.string().optional(),
    syncToken: z.string().optional(),
    timeZone: z.string().optional(),
});

export const createEventOptionsSchema = z.object({
    sendUpdates: sendUpdatesSchema.optional(),
    conferenceDataVersion: z.number().min(0).max(1).optional(),
});

export const updateEventOptionsSchema = z.object({
    sendUpdates: sendUpdatesSchema.optional(),
});

export const deleteEventOptionsSchema = z.object({
    sendUpdates: sendUpdatesSchema.optional(),
});

export const rescheduleEventOptionsSchema = z.object({
    sendUpdates: sendUpdatesSchema.optional(),
});

export const quickCreateEventOptionsSchema = z.object({
    description: z.string().optional(),
    location: z.string().optional(),
    attendees: z.array(z.string().email()).optional(),
    sendUpdates: sendUpdatesSchema.optional(),
    conferenceDataVersion: z.number().min(0).max(1).optional(),
    createConference: z.boolean().optional(),
    colorId: z.string().optional(),
    reminders: eventReminderSchema.optional(),
});

// ==================================================
// Event Result Schemas
// ==================================================

export const getEventsResultSchema = z.object({
    events: z.array(calendarEventSchema),
    nextPageToken: z.string().optional(),
    updated: z.string().optional(),
    timeZone: z.string().optional(),
    accessRole: z.string().optional(),
    defaultReminders: z.array(eventReminderSchema).optional(),
    nextSyncToken: z.string().optional(),
});

export const listEventsFromPrimaryCalendarResultSchema = z.object({
    events: z.array(calendarEventSchema),
    nextPageToken: z.string().optional(),
    updated: z.string().optional(),
    timeZone: z.string().optional(),
    accessRole: z.string().optional(),
    defaultReminders: z.array(eventReminderSchema).optional(),
    nextSyncToken: z.string().optional(),
    calendarId: z.string(),
});

export const getEventFromPrimaryCalendarResultSchema = calendarEventSchema.and(
    z.object({
        calendarId: z.string(),
    }),
);

export const createEventInPrimaryCalendarResultSchema = calendarEventSchema.and(
    z.object({
        calendarId: z.string(),
    }),
);

export const updateEventInPrimaryCalendarResultSchema = calendarEventSchema.and(
    z.object({
        calendarId: z.string(),
    }),
);

export const deleteEventFromPrimaryCalendarResultSchema = z.object({
    success: z.boolean().optional(),
    calendarId: z.string(),
});

export const rescheduleEventInPrimaryCalendarResultSchema = calendarEventSchema.and(
    z.object({
        calendarId: z.string(),
    }),
);

export const quickCreateEventInPrimaryCalendarResultSchema = calendarEventSchema.and(
    z.object({
        calendarId: z.string(),
    }),
);

export const getUpdatedEventsResultSchema = z.object({
    events: z.array(calendarEventSchema),
    deletedEvents: z.array(z.string()),
    nextPageToken: z.string().optional(),
    nextSyncToken: z.string().optional(),
    lastSyncTime: z.string(),
});

// ==================================================
// Event Conference Schemas
// ==================================================

export const conferenceDataSchema = z.object({
    createRequest: z.object({
        requestId: z.string(),
        conferenceSolutionKey: z.object({
            type: z.literal('hangoutsMeet'),
        }),
    }),
});

// ==================================================
// Event Response Schemas
// ==================================================

export const eventResponseSchema = z.object({
    success: z.boolean(),
    event: calendarEventSchema.optional(),
    error: z.string().optional(),
    calendarId: z.string().optional(),
});

// ==================================================
// Event Filter Schemas
// ==================================================

export const eventFiltersSchema = z.object({
    timeRange: z
        .object({
            start: z.string(),
            end: z.string(),
        })
        .optional(),
    attendees: z.array(z.string().email()).optional(),
    location: z.string().optional(),
    summary: z.string().optional(),
    isRecurring: z.boolean().optional(),
    isAllDay: z.boolean().optional(),
});

// ==================================================
// Event Sync Schemas
// ==================================================

export const eventSyncResultSchema = z.object({
    events: z.array(calendarEventSchema),
    deletedEvents: z.array(z.string()),
    nextSyncToken: z.string().optional(),
    lastSyncTime: z.string(),
});

export const eventSyncOptionsSchema = z.object({
    syncToken: z.string().optional(),
    timeZone: z.string().optional(),
    maxResults: z.number().min(1).max(2500).optional(),
});

// ==================================================
// Batch Operation Schemas
// ==================================================

export const batchOperationSchema = z.object({
    type: z.enum(['create', 'update', 'delete']),
    eventId: z.string().optional(),
    event: calendarEventSchema.partial().optional(),
});

export const batchOperationsOptionsSchema = z.object({
    sendUpdates: sendUpdatesSchema.optional(),
});

export const batchOperationResultSchema = z.object({
    successful: z.array(
        z.object({
            operation: batchOperationSchema,
            result: z.union([calendarEventSchema, z.object({ deleted: z.boolean() })]).optional(),
        }),
    ),
    failed: z.array(
        z.object({
            operation: batchOperationSchema,
            error: z.string(),
        }),
    ),
});
