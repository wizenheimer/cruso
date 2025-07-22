import { z } from 'zod';

// ==================================================
// Base Zod Schemas
// ==================================================

export const sendUpdatesSchema = z.enum(['all', 'externalOnly', 'none']);
export const eventStatusSchema = z.enum(['confirmed', 'tentative', 'cancelled']);
export const frequencySchema = z.enum(['daily', 'weekly', 'monthly', 'yearly']);
export const weekStartSchema = z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']);

// ==================================================
// Recurring Events Service Schemas
// ==================================================

export const getRecurringEventInstancesOptionsSchema = z.object({
    maxResults: z.number().min(1).max(2500).optional(),
    pageToken: z.string().optional(),
    timeZone: z.string().optional(),
    showDeleted: z.boolean().optional(),
});

export const getRecurringEventInstancesResultSchema = z.object({
    instances: z.array(z.any()), // CalendarEvent type
    nextPageToken: z.string().optional(),
});

export const getRecurringEventInstancesInPrimaryCalendarResultSchema =
    getRecurringEventInstancesResultSchema.extend({
        calendarId: z.string(),
    });

export const createRecurringEventOptionsSchema = z.object({
    sendUpdates: sendUpdatesSchema.optional(),
    conferenceDataVersion: z.number().min(0).max(1).optional(),
});

export const createRecurringEventInPrimaryCalendarResultSchema = z.object({
    calendarId: z.string(),
    event: z.any(), // CalendarEvent type
});

export const recurringEventSchema = z.object({
    recurrence: z.array(z.any()).optional(), // RecurrenceRule[] type
    // ... other CalendarEvent properties would be here
});

export const updateRecurringEventOptionsSchema = z.object({
    sendUpdates: sendUpdatesSchema.optional(),
});

export const updateRecurringEventInPrimaryCalendarResultSchema = z.object({
    calendarId: z.string(),
    event: z.any(), // CalendarEvent type
});

export const updateRecurringEventDataSchema = z
    .object({
        recurrence: z.array(z.any()).optional(), // RecurrenceRule[] type
    })
    .and(z.any()); // Partial<CalendarEvent> type

export const updateFutureRecurringEventsOptionsSchema = z.object({
    sendUpdates: sendUpdatesSchema.optional(),
});

export const updateFutureRecurringEventsDataSchema = z
    .object({
        recurrence: z.array(z.any()).optional(), // RecurrenceRule[] type
    })
    .and(z.any()); // Partial<CalendarEvent> type

export const updateFutureRecurringEventsInPrimaryCalendarResultSchema = z.object({
    calendarId: z.string(),
    event: z.any(), // CalendarEvent type
});

export const getRecurringEventOptionsSchema = z.object({
    timeZone: z.string().optional(),
    alwaysIncludeEmail: z.boolean().optional(),
    maxAttendees: z.number().min(1).max(100).optional(),
});

export const getRecurringEventFromPrimaryCalendarResultSchema = z.object({
    calendarId: z.string(),
    event: z.any(), // CalendarEvent type
});

export const rescheduleRecurringEventOptionsSchema = z.object({
    sendUpdates: sendUpdatesSchema.optional(),
});

export const rescheduleRecurringEventInPrimaryCalendarResultSchema = z.object({
    calendarId: z.string(),
    event: z.any(), // CalendarEvent type
});

export const updateRecurringEventInstanceOptionsSchema = z.object({
    sendUpdates: sendUpdatesSchema.optional(),
});

export const updateRecurringEventInstanceInPrimaryCalendarResultSchema = z.object({
    calendarId: z.string(),
    event: z.any(), // CalendarEvent type
});

export const deleteRecurringEventOptionsSchema = z.object({
    sendUpdates: sendUpdatesSchema.optional(),
});

export const deleteRecurringEventFromPrimaryCalendarResultSchema = z.object({
    calendarId: z.string(),
});

export const deleteRecurringEventInstanceOptionsSchema = z.object({
    sendUpdates: sendUpdatesSchema.optional(),
});

export const deleteRecurringEventInstanceInPrimaryCalendarResultSchema = z.object({
    calendarId: z.string(),
});

export const batchCreateRecurringEventsOptionsSchema = z.object({
    sendUpdates: sendUpdatesSchema.optional(),
    conferenceDataVersion: z.number().min(0).max(1).optional(),
});

export const batchCreateRecurringEventsResultSchema = z.object({
    successful: z.array(
        z.object({
            event: recurringEventSchema,
            result: z.any(), // CalendarEvent type
        }),
    ),
    failed: z.array(
        z.object({
            event: recurringEventSchema,
            error: z.string(),
        }),
    ),
});

// ==================================================
// Recurring Event Instance Schemas
// ==================================================

export const recurringEventInstanceSchema = z.object({
    eventId: z.string(),
    originalStartTime: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    status: eventStatusSchema,
    isException: z.boolean().optional(),
});

export const recurringEventInstanceUpdateSchema = z.object({
    instanceStartTime: z.string(),
    updates: z.any(), // Partial<CalendarEvent> type
});

// ==================================================
// Recurring Event Pattern Schemas
// ==================================================

export const recurringEventPatternSchema = z.object({
    frequency: frequencySchema,
    interval: z.number().min(1).optional(),
    count: z.number().min(1).optional(),
    until: z.string().optional(),
    byDay: z.array(z.string()).optional(),
    byMonthDay: z.array(z.number().min(1).max(31)).optional(),
    byYearDay: z.array(z.number().min(1).max(366)).optional(),
    byWeekNo: z.array(z.number().min(1).max(53)).optional(),
    byMonth: z.array(z.number().min(1).max(12)).optional(),
    bySetPos: z.array(z.number().min(-366).max(366)).optional(),
    weekStart: weekStartSchema.optional(),
});

// ==================================================
// Recurring Event Exception Schemas
// ==================================================

export const recurringEventExceptionSchema = z.object({
    originalStartTime: z.string(),
    newStartTime: z.string().optional(),
    newEndTime: z.string().optional(),
    cancelled: z.boolean().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
});

// ==================================================
// Recurring Event Expansion Schemas
// ==================================================

export const recurringEventExpansionOptionsSchema = z.object({
    timeMin: z.string(),
    timeMax: z.string(),
    maxInstances: z.number().min(1).max(1000).optional(),
    includeExceptions: z.boolean().optional(),
    includeCancelled: z.boolean().optional(),
});

export const recurringEventExpansionResultSchema = z.object({
    instances: z.array(recurringEventInstanceSchema),
    exceptions: z.array(recurringEventExceptionSchema),
    nextPageToken: z.string().optional(),
});

// ==================================================
// Recurring Event Validation Schemas
// ==================================================

export const recurringEventValidationResultSchema = z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
});

export const recurringEventValidationOptionsSchema = z.object({
    checkConflicts: z.boolean().optional(),
    validateDates: z.boolean().optional(),
    checkLimits: z.boolean().optional(),
});

// ==================================================
// Recurring Event Sync Schemas
// ==================================================

export const recurringEventSyncOptionsSchema = z.object({
    syncToken: z.string().optional(),
    timeMin: z.string().optional(),
    timeMax: z.string().optional(),
    maxResults: z.number().min(1).max(2500).optional(),
    showDeleted: z.boolean().optional(),
    expandRecurring: z.boolean().optional(),
});

export const recurringEventSyncResultSchema = z.object({
    events: z.array(z.any()), // CalendarEvent type
    deletedEvents: z.array(z.string()),
    nextSyncToken: z.string().optional(),
    lastSyncTime: z.string(),
    expandedInstances: z.number().min(0),
});

// ==================================================
// Recurring Event Query Schemas
// ==================================================

export const recurringEventQuerySchema = z.object({
    recurringEventId: z.string().optional(),
    timeMin: z.string().optional(),
    timeMax: z.string().optional(),
    status: eventStatusSchema.optional(),
    attendees: z.array(z.string().email()).optional(),
    location: z.string().optional(),
    summary: z.string().optional(),
});

export const recurringEventQueryResultSchema = z.object({
    events: z.array(z.any()), // CalendarEvent type
    totalResults: z.number().min(0),
    nextPageToken: z.string().optional(),
});
