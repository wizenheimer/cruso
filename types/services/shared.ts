import { z } from 'zod';

// ==================================================
// Shared Zod Schemas
// ==================================================

export const frequencySchema = z.enum([
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'YEARLY',
    'HOURLY',
    'MINUTELY',
    'SECONDLY',
]);

export const weekdaySchema = z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']);

export const calendarSyncStatusSchema = z.enum(['active', 'error', 'paused']);

export const reminderMethodSchema = z.enum(['email', 'popup']);

export const attendeeResponseStatusSchema = z.enum([
    'needsAction',
    'declined',
    'tentative',
    'accepted',
]);

export const eventStatusSchema = z.enum(['confirmed', 'tentative', 'cancelled']);

export const eventTransparencySchema = z.enum(['opaque', 'transparent']);

export const eventVisibilitySchema = z.enum(['default', 'public', 'private', 'confidential']);

// ==================================================
// Calendar Sync Status Schema
// ==================================================

export const calendarSyncStatusObjectSchema = z.object({
    calendarId: z.string(),
    status: calendarSyncStatusSchema,
    lastSyncAt: z.string().optional(),
    errorCount: z.number(),
    lastError: z.string().optional(),
});

// ==================================================
// Event Date/Time Schema
// ==================================================

export const eventDateTimeSchema = z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional(),
});

// ==================================================
// Event Attendee Schema
// ==================================================

export const eventAttendeeSchema = z.object({
    email: z.string().email(),
    displayName: z.string().optional(),
    responseStatus: attendeeResponseStatusSchema.optional(),
    optional: z.boolean().optional(),
    resource: z.boolean().optional(),
    organizer: z.boolean().optional(),
    self: z.boolean().optional(),
    comment: z.string().optional(),
    additionalGuests: z.number().nonnegative().optional(),
});

// ==================================================
// Event Reminder Schema
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
// Event Organizer/Creator Schema
// ==================================================

export const eventPersonSchema = z.object({
    email: z.string().email().optional(),
    displayName: z.string().optional(),
    self: z.boolean().optional(),
});

// ==================================================
// Event Source Schema
// ==================================================

export const eventSourceSchema = z.object({
    url: z.string().url().optional(),
    title: z.string().optional(),
});

// ==================================================
// Event Attachment Schema
// ==================================================

export const eventAttachmentSchema = z.object({
    fileUrl: z.string().url().nullable().optional(),
    title: z.string().nullable().optional(),
    mimeType: z.string().nullable().optional(),
    iconLink: z.string().url().nullable().optional(),
    fileId: z.string().nullable().optional(),
});

// ==================================================
// Time Range Schema
// ==================================================

export const timeRangeSchema = z.object({
    start: z.string(), // RFC3339
    end: z.string(), // RFC3339
});

// ==================================================
// Shared Type Exports
// ==================================================

export type Frequency = z.infer<typeof frequencySchema>;
export type Weekday = z.infer<typeof weekdaySchema>;
export type CalendarSyncStatus = z.infer<typeof calendarSyncStatusSchema>;
export type CalendarSyncStatusObject = z.infer<typeof calendarSyncStatusObjectSchema>;
export type ReminderMethod = z.infer<typeof reminderMethodSchema>;
export type AttendeeResponseStatus = z.infer<typeof attendeeResponseStatusSchema>;
export type EventStatus = z.infer<typeof eventStatusSchema>;
export type EventTransparency = z.infer<typeof eventTransparencySchema>;
export type EventVisibility = z.infer<typeof eventVisibilitySchema>;
export type EventDateTime = z.infer<typeof eventDateTimeSchema>;
export type EventAttendee = z.infer<typeof eventAttendeeSchema>;
export type EventReminder = z.infer<typeof eventReminderSchema>;
export type EventPerson = z.infer<typeof eventPersonSchema>;
export type EventSource = z.infer<typeof eventSourceSchema>;
export type EventAttachment = z.infer<typeof eventAttachmentSchema>;
export type TimeRange = z.infer<typeof timeRangeSchema>;
