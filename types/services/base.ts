import { z } from 'zod';
import { calendar_v3 } from 'googleapis';
import {
    frequencySchema,
    weekdaySchema,
    calendarSyncStatusSchema,
    reminderMethodSchema,
    attendeeResponseStatusSchema,
    eventStatusSchema,
    eventTransparencySchema,
    eventVisibilitySchema,
    eventDateTimeSchema,
    eventAttendeeSchema,
    eventReminderSchema,
    eventPersonSchema,
    eventSourceSchema,
    eventAttachmentSchema,
    timeRangeSchema,
    type Frequency,
    type Weekday,
    type CalendarSyncStatus,
    type ReminderMethod,
    type AttendeeResponseStatus,
    type EventStatus,
    type EventTransparency,
    type EventVisibility,
    type EventDateTime,
    type EventAttendee,
    type EventReminder,
    type EventPerson,
    type EventSource,
    type EventAttachment,
    type TimeRange,
} from './shared';

// ==================================================
// Recurrence Rule Schema
// ==================================================

export const recurrenceRuleSchema = z.object({
    freq: frequencySchema,
    dtstart: z.date().optional(),
    interval: z.number().positive().optional(),
    wkst: weekdaySchema.optional(),
    count: z.number().positive().optional(),
    until: z.date().optional(),
    bysetpos: z.array(z.number()).optional(),
    bymonth: z.array(z.number().min(1).max(12)).optional(),
    bymonthday: z.array(z.number().min(1).max(31)).optional(),
    byyearday: z.array(z.number().min(1).max(366)).optional(),
    byweekno: z.array(z.number().min(1).max(53)).optional(),
    byweekday: z.array(weekdaySchema).optional(),
    byhour: z.array(z.number().min(0).max(23)).optional(),
    byminute: z.array(z.number().min(0).max(59)).optional(),
    bysecond: z.array(z.number().min(0).max(59)).optional(),
    byeaster: z.number().nullable().optional(),
});

// ==================================================
// Calendar Event Schema
// ==================================================

export const calendarEventSchema = z.object({
    id: z.string().optional(),
    summary: z.string(),
    description: z.string().optional(),
    start: eventDateTimeSchema,
    end: eventDateTimeSchema,
    attendees: z.array(eventAttendeeSchema).optional(),
    location: z.string().optional(),
    conferenceData: z.any().optional(), // Google Calendar API conference data structure
    reminders: eventReminderSchema.optional(),
    recurringEventId: z.string().optional(),
    originalStartTime: eventDateTimeSchema.optional(),
    created: z.string().optional(),
    updated: z.string().optional(),
    status: eventStatusSchema.optional(),
    organizer: eventPersonSchema.optional(),
    creator: eventPersonSchema.optional(),
    htmlLink: z.string().url().optional(),
    transparency: eventTransparencySchema.optional(),
    visibility: eventVisibilitySchema.optional(),
    iCalUID: z.string().optional(),
    sequence: z.number().nonnegative().optional(),
    colorId: z.string().optional(),
    recurrence: z.union([z.array(z.string()), z.array(recurrenceRuleSchema)]).optional(),
    extendedProperties: z
        .object({
            private: z.record(z.string()).optional(),
            shared: z.record(z.string()).optional(),
        })
        .optional(),
    hangoutLink: z.string().url().optional(),
    anyoneCanAddSelf: z.boolean().optional(),
    guestsCanInviteOthers: z.boolean().optional(),
    guestsCanModify: z.boolean().optional(),
    guestsCanSeeOtherGuests: z.boolean().optional(),
    privateCopy: z.boolean().optional(),
    locked: z.boolean().optional(),
    source: eventSourceSchema.optional(),
    attachments: z.array(eventAttachmentSchema).optional(),
});

// ==================================================
// Calendar Info Schema
// ==================================================

export const calendarInfoSchema = z.object({
    id: z.string(),
    summary: z.string(),
    description: z.string().optional(),
    primary: z.boolean().optional(),
    accessRole: z.string().optional(),
    backgroundColor: z.string().optional(),
    foregroundColor: z.string().optional(),
    timeZone: z.string().optional(),
    syncStatus: calendarSyncStatusSchema,
    lastSyncAt: z.string().optional(),
    googleEmail: z.string().email(),
});

// ==================================================
// Type Exports
// ==================================================

export type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type CalendarInfo = z.infer<typeof calendarInfoSchema>;

// Re-export shared types for convenience
export type {
    Frequency,
    Weekday,
    CalendarSyncStatus,
    ReminderMethod,
    AttendeeResponseStatus,
    EventStatus,
    EventTransparency,
    EventVisibility,
    EventDateTime,
    EventAttendee,
    EventReminder,
    EventPerson,
    EventSource,
    EventAttachment,
    TimeRange,
} from './shared';

// Re-export shared schemas for convenience
export {
    frequencySchema,
    weekdaySchema,
    calendarSyncStatusSchema,
    reminderMethodSchema,
    attendeeResponseStatusSchema,
    eventStatusSchema,
    eventTransparencySchema,
    eventVisibilitySchema,
    eventDateTimeSchema,
    eventAttendeeSchema,
    eventReminderSchema,
    eventPersonSchema,
    eventSourceSchema,
    eventAttachmentSchema,
    timeRangeSchema,
} from './shared';
