import { z } from 'zod';

// ==================================================
// Base Zod Schemas
// ==================================================

export const sendUpdatesSchema = z.enum(['all', 'externalOnly', 'none']);
export const eventStatusSchema = z.enum(['confirmed', 'tentative', 'cancelled']);
export const eventTransparencySchema = z.enum(['opaque', 'transparent']);
export const eventVisibilitySchema = z.enum(['default', 'public', 'private', 'confidential']);
export const reminderMethodSchema = z.enum(['email', 'popup']);
export const attendeeResponseStatusSchema = z.enum([
    'needsAction',
    'declined',
    'tentative',
    'accepted',
]);
export const orderBySchema = z.enum(['startTime', 'updated']);

// ==================================================
// Event Options Schemas
// ==================================================

export const getEventsOptionsSchema = z.object({
    maxResults: z.number().min(1).max(2500).optional(),
    pageToken: z.string().optional(),
    q: z.string().optional(),
    showDeleted: z.boolean().optional(),
    singleEvents: z.boolean().optional(),
    orderBy: orderBySchema.optional(),
    timeZone: z.string().optional(),
    alwaysIncludeEmail: z.boolean().optional(),
    iCalUID: z.string().optional(),
});

export const getEventOptionsSchema = z.object({
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
    reminders: z
        .object({
            useDefault: z.boolean().optional(),
            overrides: z
                .array(
                    z.object({
                        method: reminderMethodSchema,
                        minutes: z.number(),
                    }),
                )
                .optional(),
        })
        .optional(),
});

// ==================================================
// Event Result Schemas
// ==================================================

export const getEventsResultSchema = z.object({
    events: z.array(z.any()), // CalendarEvent type
    nextPageToken: z.string().optional(),
    nextSyncToken: z.string().optional(),
});

export const getEventsFromPrimaryCalendarResultSchema = getEventsResultSchema.extend({
    calendarId: z.string(),
});

export const getEventFromPrimaryCalendarResultSchema = z.object({
    calendarId: z.string(),
    event: z.any(), // CalendarEvent type
});

export const getUpdatedEventsResultSchema = z.object({
    events: z.array(z.any()), // CalendarEvent type
    deletedEvents: z.array(z.string()),
    nextPageToken: z.string().optional(),
    nextSyncToken: z.string().optional(),
});

export const createEventInPrimaryCalendarResultSchema = z.object({
    calendarId: z.string(),
    event: z.any(), // CalendarEvent type
});

export const updateEventInPrimaryCalendarResultSchema = z.object({
    calendarId: z.string(),
    event: z.any(), // CalendarEvent type
});

export const deleteEventFromPrimaryCalendarResultSchema = z.object({
    calendarId: z.string(),
});

export const rescheduleEventInPrimaryCalendarResultSchema = z.object({
    calendarId: z.string(),
    event: z.any(), // CalendarEvent type
});

export const quickCreateEventInPrimaryCalendarResultSchema = z.object({
    calendarId: z.string(),
    event: z.any(), // CalendarEvent type
});

// ==================================================
// Event Reminder Schemas
// ==================================================

export const eventReminderSchema = z.object({
    useDefault: z.boolean().optional(),
    overrides: z
        .array(
            z.object({
                method: reminderMethodSchema,
                minutes: z.number(),
            }),
        )
        .optional(),
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
// Event Attendee Schemas
// ==================================================

export const eventAttendeeSchema = z.object({
    email: z.string().email(),
    displayName: z.string().optional(),
    responseStatus: attendeeResponseStatusSchema.optional(),
});

// ==================================================
// Event Time Schemas
// ==================================================

export const eventDateTimeSchema = z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional(),
});

// ==================================================
// Event Status Schemas
// ==================================================

// These schemas are already defined as constants at the top of the file
// and are used throughout this file

// ==================================================
// Event Response Schemas
// ==================================================

export const eventResponseSchema = z.object({
    success: z.boolean(),
    event: z.any().optional(), // CalendarEvent type
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
    events: z.array(z.any()), // CalendarEvent type
    deletedEvents: z.array(z.string()),
    nextSyncToken: z.string().optional(),
    lastSyncTime: z.string(),
});

export const eventSyncOptionsSchema = z.object({
    syncToken: z.string().optional(),
    timeMin: z.string().optional(),
    timeMax: z.string().optional(),
    maxResults: z.number().min(1).max(2500).optional(),
    showDeleted: z.boolean().optional(),
});

// ==================================================
// Batch Operation Schemas
// ==================================================

export const batchOperationSchema = z.object({
    type: z.enum(['create', 'update', 'delete']),
    eventId: z.string().optional(),
    event: z.any().optional(), // CalendarEvent | Partial<CalendarEvent> type
});

export const batchOperationsOptionsSchema = z.object({
    sendUpdates: sendUpdatesSchema.optional(),
});

export const batchOperationResultSchema = z.object({
    successful: z.array(
        z.object({
            operation: batchOperationSchema,
            result: z.any().optional(),
        }),
    ),
    failed: z.array(
        z.object({
            operation: batchOperationSchema,
            error: z.string(),
        }),
    ),
});
