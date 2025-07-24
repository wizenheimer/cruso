import { z } from 'zod';

/**
 * Schema for listing events from one or more calendars
 * Supports filtering by time range and timezone specification
 */
export const listEventsToolSchema = z.object({
    calendarId: z
        .string()
        .describe(
            'ID of the calendar(s) to list events from. Accepts either a single calendar ID string or an array of calendar IDs (passed as JSON string like \'["cal1", "cal2"]\')',
        ),
    timeMin: z
        .string()
        .refine((val) => {
            const withTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(
                val,
            );
            const withoutTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val);
            return withTimezone || withoutTimezone;
        }, "Must be ISO 8601 format: '2026-01-01T00:00:00'")
        .describe(
            "Start time boundary. Preferred: '2024-01-01T00:00:00' (uses timeZone parameter or calendar timezone). Also accepts: '2024-01-01T00:00:00Z' or '2024-01-01T00:00:00-08:00'.",
        )
        .optional(),
    timeMax: z
        .string()
        .refine((val) => {
            const withTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(
                val,
            );
            const withoutTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val);
            return withTimezone || withoutTimezone;
        }, "Must be ISO 8601 format: '2026-01-01T00:00:00'")
        .describe(
            "End time boundary. Preferred: '2024-01-01T23:59:59' (uses timeZone parameter or calendar timezone). Also accepts: '2024-01-01T23:59:59Z' or '2024-01-01T23:59:59-08:00'.",
        )
        .optional(),
    timeZone: z
        .string()
        .optional()
        .describe(
            "Timezone as IANA Time Zone Database name (e.g., America/Los_Angeles). Takes priority over calendar's default timezone. Only used for timezone-naive datetime strings.",
        ),
});

export const listEventsFromPrimaryCalendarToolSchema = listEventsToolSchema.omit({
    calendarId: true,
});

/**
 * Schema for searching events in a calendar by text query
 * Searches across event summaries, descriptions, locations, attendees, etc.
 */
export const searchEventsToolSchema = z.object({
    calendarId: z.string().describe("ID of the calendar (use 'primary' for the main calendar)"),
    query: z
        .string()
        .describe(
            'Free text search query (searches summary, description, location, attendees, etc.)',
        ),
    timeMin: z
        .string()
        .refine((val) => {
            const withTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(
                val,
            );
            const withoutTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val);
            return withTimezone || withoutTimezone;
        }, "Must be ISO 8601 format: '2026-01-01T00:00:00'")
        .describe(
            "Start time boundary. Preferred: '2024-01-01T00:00:00' (uses timeZone parameter or calendar timezone). Also accepts: '2024-01-01T00:00:00Z' or '2024-01-01T00:00:00-08:00'.",
        ),
    timeMax: z
        .string()
        .refine((val) => {
            const withTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(
                val,
            );
            const withoutTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val);
            return withTimezone || withoutTimezone;
        }, "Must be ISO 8601 format: '2026-01-01T00:00:00'")
        .describe(
            "End time boundary. Preferred: '2024-01-01T23:59:59' (uses timeZone parameter or calendar timezone). Also accepts: '2024-01-01T23:59:59Z' or '2024-01-01T23:59:59-08:00'.",
        ),
    timeZone: z
        .string()
        .optional()
        .describe(
            "Timezone as IANA Time Zone Database name (e.g., America/Los_Angeles). Takes priority over calendar's default timezone. Only used for timezone-naive datetime strings.",
        ),
});

export const searchEventsFromPrimaryCalendarToolSchema = searchEventsToolSchema.omit({
    calendarId: true,
});

/**
 * Schema for creating a new calendar event
 * Supports recurring events, reminders, attendees, and various event properties
 */
export const createEventToolSchema = z.object({
    calendarId: z.string().describe("ID of the calendar (use 'primary' for the main calendar)"),
    summary: z.string().describe('Title of the event'),
    description: z.string().optional().describe('Description/notes for the event'),
    start: z
        .string()
        .refine((val) => {
            const withTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(
                val,
            );
            const withoutTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val);
            return withTimezone || withoutTimezone;
        }, "Must be ISO 8601 format: '2026-01-01T00:00:00'")
        .describe("Event start time: '2024-01-01T10:00:00'"),
    end: z
        .string()
        .refine((val) => {
            const withTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(
                val,
            );
            const withoutTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val);
            return withTimezone || withoutTimezone;
        }, "Must be ISO 8601 format: '2026-01-01T00:00:00'")
        .describe("Event end time: '2024-01-01T11:00:00'"),
    timeZone: z
        .string()
        .optional()
        .describe(
            "Timezone as IANA Time Zone Database name (e.g., America/Los_Angeles). Takes priority over calendar's default timezone. Only used for timezone-naive datetime strings.",
        ),
    location: z.string().optional().describe('Location of the event'),
    attendees: z
        .array(
            z.object({
                email: z.string().email().describe('Email address of the attendee'),
            }),
        )
        .optional()
        .describe('List of attendee email addresses'),
    colorId: z
        .string()
        .optional()
        .describe('Color ID for the event (use list-colors to see available IDs)'),
    reminders: z
        .object({
            useDefault: z.boolean().describe('Whether to use the default reminders'),
            overrides: z
                .array(
                    z
                        .object({
                            method: z
                                .enum(['email', 'popup'])
                                .default('popup')
                                .describe('Reminder method'),
                            minutes: z
                                .number()
                                .describe('Minutes before the event to trigger the reminder'),
                        })
                        .partial({ method: true }),
                )
                .optional()
                .describe('Custom reminders'),
        })
        .describe('Reminder settings for the event')
        .optional(),
    recurrence: z
        .array(z.string())
        .optional()
        .describe('Recurrence rules in RFC5545 format (e.g., ["RRULE:FREQ=WEEKLY;COUNT=5"])'),
});

export const createEventInPrimaryCalendarToolSchema = createEventToolSchema.omit({
    calendarId: true,
});

/**
 * Schema for updating an existing calendar event
 * Supports partial updates and recurring event modification scopes
 */
const updateEventBaseSchema = z.object({
    calendarId: z.string().describe("ID of the calendar (use 'primary' for the main calendar)"),
    eventId: z.string().describe('ID of the event to update'),
    summary: z.string().optional().describe('Updated title of the event'),
    description: z.string().optional().describe('Updated description/notes'),
    start: z
        .string()
        .refine((val) => {
            const withTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(
                val,
            );
            const withoutTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val);
            return withTimezone || withoutTimezone;
        }, "Must be ISO 8601 format: '2026-01-01T00:00:00'")
        .describe("Updated start time: '2024-01-01T10:00:00'")
        .optional(),
    end: z
        .string()
        .refine((val) => {
            const withTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(
                val,
            );
            const withoutTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val);
            return withTimezone || withoutTimezone;
        }, "Must be ISO 8601 format: '2026-01-01T00:00:00'")
        .describe("Updated end time: '2024-01-01T11:00:00'")
        .optional(),
    timeZone: z
        .string()
        .optional()
        .describe(
            "Updated timezone as IANA Time Zone Database name. If not provided, uses the calendar's default timezone.",
        ),
    location: z.string().optional().describe('Updated location'),
    attendees: z
        .array(
            z.object({
                email: z.string().email().describe('Email address of the attendee'),
            }),
        )
        .optional()
        .describe('Updated attendee list'),
    colorId: z.string().optional().describe('Updated color ID'),
    reminders: z
        .object({
            useDefault: z.boolean().describe('Whether to use the default reminders'),
            overrides: z
                .array(
                    z
                        .object({
                            method: z
                                .enum(['email', 'popup'])
                                .default('popup')
                                .describe('Reminder method'),
                            minutes: z
                                .number()
                                .describe('Minutes before the event to trigger the reminder'),
                        })
                        .partial({ method: true }),
                )
                .optional()
                .describe('Custom reminders'),
        })
        .describe('Reminder settings for the event')
        .optional(),
    recurrence: z.array(z.string()).optional().describe('Updated recurrence rules'),
    sendUpdates: z
        .enum(['all', 'externalOnly', 'none'])
        .default('all')
        .describe('Whether to send update notifications'),
    modificationScope: z
        .enum(['thisAndFollowing', 'all', 'thisEventOnly'])
        .optional()
        .describe('Scope for recurring event modifications'),
    originalStartTime: z
        .string()
        .refine((val) => {
            const withTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(
                val,
            );
            const withoutTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val);
            return withTimezone || withoutTimezone;
        }, "Must be ISO 8601 format: '2026-01-01T00:00:00'")
        .describe("Original start time in the ISO 8601 format '2024-01-01T10:00:00'")
        .optional(),
    futureStartDate: z
        .string()
        .refine((val) => {
            const withTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(
                val,
            );
            const withoutTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val);
            return withTimezone || withoutTimezone;
        }, "Must be ISO 8601 format: '2026-01-01T00:00:00'")
        .describe("Start date for future instances in the ISO 8601 format '2024-01-01T10:00:00'")
        .optional(),
});

export const updateEventToolSchema = updateEventBaseSchema
    .refine(
        (data) => {
            // Require originalStartTime when modificationScope is 'thisEventOnly'
            if (data.modificationScope === 'thisEventOnly' && !data.originalStartTime) {
                return false;
            }
            return true;
        },
        {
            message: "originalStartTime is required when modificationScope is 'thisEventOnly'",
            path: ['originalStartTime'],
        },
    )
    .refine(
        (data) => {
            // Require futureStartDate when modificationScope is 'thisAndFollowing'
            if (data.modificationScope === 'thisAndFollowing' && !data.futureStartDate) {
                return false;
            }
            return true;
        },
        {
            message: "futureStartDate is required when modificationScope is 'thisAndFollowing'",
            path: ['futureStartDate'],
        },
    )
    .refine(
        (data) => {
            // Ensure futureStartDate is in the future when provided
            if (data.futureStartDate) {
                const futureDate = new Date(data.futureStartDate);
                const now = new Date();
                return futureDate > now;
            }
            return true;
        },
        {
            message: 'futureStartDate must be in the future',
            path: ['futureStartDate'],
        },
    );

export const updateEventInPrimaryCalendarToolSchema = updateEventBaseSchema
    .omit({
        calendarId: true,
    })
    .refine(
        (data) => {
            // Require originalStartTime when modificationScope is 'thisEventOnly'
            if (data.modificationScope === 'thisEventOnly' && !data.originalStartTime) {
                return false;
            }
            return true;
        },
        {
            message: "originalStartTime is required when modificationScope is 'thisEventOnly'",
            path: ['originalStartTime'],
        },
    )
    .refine(
        (data) => {
            // Require futureStartDate when modificationScope is 'thisAndFollowing'
            if (data.modificationScope === 'thisAndFollowing' && !data.futureStartDate) {
                return false;
            }
            return true;
        },
        {
            message: "futureStartDate is required when modificationScope is 'thisAndFollowing'",
            path: ['futureStartDate'],
        },
    )
    .refine(
        (data) => {
            // Ensure futureStartDate is in the future when provided
            if (data.futureStartDate) {
                const futureDate = new Date(data.futureStartDate);
                const now = new Date();
                return futureDate > now;
            }
            return true;
        },
        {
            message: 'futureStartDate must be in the future',
            path: ['futureStartDate'],
        },
    );

/**
 * Schema for deleting a calendar event
 * Supports notification settings for attendees
 */
export const deleteEventToolSchema = z.object({
    calendarId: z.string().describe("ID of the calendar (use 'primary' for the main calendar)"),
    eventId: z.string().describe('ID of the event to delete'),
    sendUpdates: z
        .enum(['all', 'externalOnly', 'none'])
        .default('all')
        .describe('Whether to send cancellation notifications'),
});

export const deleteEventInPrimaryCalendarToolSchema = deleteEventToolSchema.omit({
    calendarId: true,
});

/**
 * Schema for querying free/busy information for calendars
 * Limited to a maximum of 3 months between timeMin and timeMax
 */
const availabilityToolSchema = z.object({
    calendars: z
        .array(
            z.object({
                id: z.string().describe("ID of the calendar (use 'primary' for the main calendar)"),
            }),
        )
        .describe('List of calendars and/or groups to query for free/busy information'),
    timeMin: z
        .string()
        .refine((val) => {
            const withTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(
                val,
            );
            const withoutTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val);
            return withTimezone || withoutTimezone;
        }, "Must be ISO 8601 format: '2026-01-01T00:00:00'")
        .describe(
            "Start time boundary. Preferred: '2024-01-01T00:00:00' (uses timeZone parameter or calendar timezone). Also accepts: '2024-01-01T00:00:00Z' or '2024-01-01T00:00:00-08:00'.",
        ),
    timeMax: z
        .string()
        .refine((val) => {
            const withTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(
                val,
            );
            const withoutTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(val);
            return withTimezone || withoutTimezone;
        }, "Must be ISO 8601 format: '2026-01-01T00:00:00'")
        .describe(
            "End time boundary. Preferred: '2024-01-01T23:59:59' (uses timeZone parameter or calendar timezone). Also accepts: '2024-01-01T23:59:59Z' or '2024-01-01T23:59:59-08:00'.",
        ),
    timeZone: z.string().optional().describe('Timezone for the query'),
    groupExpansionMax: z
        .number()
        .int()
        .max(100)
        .optional()
        .describe('Maximum number of calendars to expand per group (max 100)'),
    calendarExpansionMax: z
        .number()
        .int()
        .max(50)
        .optional()
        .describe('Maximum number of calendars to expand (max 50)'),
});

export const freeBusyOmitCalendarsSchema = availabilityToolSchema.omit({
    calendars: true,
});

export const freeBusyIncludeCalendarsSchema = availabilityToolSchema;
