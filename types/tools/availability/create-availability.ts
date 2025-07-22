import z from 'zod';

/**
 * Schema for calendar event attendee information
 */
export const calendarEventAttendeeSchema = z.object({
    email: z.string().email().describe('Email address of the attendee'),
    displayName: z.string().optional().describe('Display name of the attendee'),
    responseStatus: z
        .string()
        .optional()
        .describe('Response status of the attendee (accepted, declined, tentative, needsAction)'),
    optional: z.boolean().optional().describe('Whether the attendee is optional'),
    resource: z.boolean().optional().describe('Whether the attendee is a resource'),
    organizer: z.boolean().optional().describe('Whether the attendee is the organizer'),
    self: z.boolean().optional().describe('Whether the attendee is the current user'),
    comment: z.string().optional().describe('Comment from the attendee'),
    additionalGuests: z.number().optional().describe('Number of additional guests'),
});

/**
 * Schema for calendar event date/time information
 */
export const calendarEventDateTimeSchema = z.object({
    dateTime: z.string().optional().describe('RFC3339 date-time string for the event'),
    date: z.string().optional().describe('Date string for all-day events'),
    timeZone: z.string().optional().describe('Timezone for the date/time'),
});

/**
 * Schema for calendar event reminder information
 */
export const calendarEventReminderSchema = z.object({
    useDefault: z.boolean().optional().describe('Whether to use default reminders'),
    overrides: z
        .array(
            z.object({
                method: z.enum(['email', 'popup']).describe('Reminder method'),
                minutes: z.number().describe('Minutes before the event to trigger the reminder'),
            }),
        )
        .optional()
        .describe('Custom reminder overrides'),
});

/**
 * Schema for calendar event organizer/creator information
 */
export const calendarEventPersonSchema = z.object({
    email: z.string().optional().describe('Email address of the person'),
    displayName: z.string().optional().describe('Display name of the person'),
    self: z.boolean().optional().describe('Whether this person is the current user'),
});

/**
 * Schema for calendar event source information
 */
export const calendarEventSourceSchema = z.object({
    url: z.string().optional().describe('URL of the event source'),
    title: z.string().optional().describe('Title of the event source'),
});

/**
 * Schema for calendar event attachment information
 */
export const calendarEventAttachmentSchema = z.object({
    fileUrl: z.string().nullable().optional().describe('URL to the attached file'),
    title: z.string().nullable().optional().describe('Title of the attachment'),
    mimeType: z.string().nullable().optional().describe('MIME type of the attachment'),
    iconLink: z.string().nullable().optional().describe('Link to the attachment icon'),
    fileId: z.string().nullable().optional().describe('ID of the attached file'),
});

/**
 * Schema for calendar event extended properties
 */
export const calendarEventExtendedPropertiesSchema = z.object({
    private: z.record(z.string()).optional().describe('Private extended properties'),
    shared: z.record(z.string()).optional().describe('Shared extended properties'),
});

/**
 * Schema for calendar event recurrence rule
 */
export const recurrenceRuleSchema = z.object({
    freq: z
        .enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'HOURLY', 'MINUTELY', 'SECONDLY'])
        .describe('Frequency of the recurring event'),
    dtstart: z.date().optional().describe('Start date of the recurrence'),
    interval: z.number().optional().describe('Interval between recurrences'),
    wkst: z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']).optional().describe('Week start day'),
    count: z.number().optional().describe('Number of occurrences'),
    until: z.date().optional().describe('End date of the recurrence'),
    bysetpos: z.array(z.number()).optional().describe('Position within the set'),
    bymonth: z.array(z.number()).optional().describe('Months when the event occurs'),
    bymonthday: z.array(z.number()).optional().describe('Days of the month when the event occurs'),
    byyearday: z.array(z.number()).optional().describe('Days of the year when the event occurs'),
    byweekno: z.array(z.number()).optional().describe('Week numbers when the event occurs'),
    byweekday: z
        .array(z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']))
        .optional()
        .describe('Days of the week when the event occurs'),
    byhour: z.array(z.number()).optional().describe('Hours when the event occurs'),
    byminute: z.array(z.number()).optional().describe('Minutes when the event occurs'),
    bysecond: z.array(z.number()).optional().describe('Seconds when the event occurs'),
    byeaster: z.number().nullable().optional().describe('Easter offset for the recurrence'),
});

/**
 * Schema for a calendar event
 */
export const calendarEventSchema = z.object({
    id: z.string().optional().describe('Unique identifier for the calendar event'),
    summary: z.string().describe('Title or summary of the calendar event'),
    description: z.string().optional().describe('Detailed description of the calendar event'),
    start: calendarEventDateTimeSchema.describe('Start date and time of the event'),
    end: calendarEventDateTimeSchema.describe('End date and time of the event'),
    attendees: z.array(calendarEventAttendeeSchema).optional().describe('List of event attendees'),
    location: z.string().optional().describe('Location of the event'),
    conferenceData: z.any().optional().describe('Conference data for video meetings'),
    reminders: calendarEventReminderSchema.optional().describe('Reminder settings for the event'),
    recurringEventId: z.string().optional().describe('ID of the recurring event series'),
    originalStartTime: calendarEventDateTimeSchema
        .optional()
        .describe('Original start time for recurring events'),
    created: z.string().optional().describe('RFC3339 timestamp when the event was created'),
    updated: z.string().optional().describe('RFC3339 timestamp when the event was last updated'),
    status: z.enum(['confirmed', 'tentative', 'cancelled']).optional().describe('Event status'),
    organizer: calendarEventPersonSchema.optional().describe('Event organizer information'),
    creator: calendarEventPersonSchema.optional().describe('Event creator information'),
    htmlLink: z.string().optional().describe('HTML link to view the event'),
    transparency: z.enum(['opaque', 'transparent']).optional().describe('Event transparency'),
    visibility: z
        .enum(['default', 'public', 'private', 'confidential'])
        .optional()
        .describe('Event visibility'),
    iCalUID: z.string().optional().describe('iCal UID for the event'),
    sequence: z.number().optional().describe('Sequence number for the event'),
    colorId: z.string().optional().describe('Color ID for the event'),
    recurrence: z
        .union([z.array(z.string()), z.array(recurrenceRuleSchema)])
        .optional()
        .describe('Recurrence rules for the event'),
    extendedProperties: calendarEventExtendedPropertiesSchema
        .optional()
        .describe('Extended properties for the event'),
    hangoutLink: z.string().optional().describe('Google Hangouts link for the event'),
    anyoneCanAddSelf: z
        .boolean()
        .optional()
        .describe('Whether anyone can add themselves to the event'),
    guestsCanInviteOthers: z.boolean().optional().describe('Whether guests can invite others'),
    guestsCanModify: z.boolean().optional().describe('Whether guests can modify the event'),
    guestsCanSeeOtherGuests: z.boolean().optional().describe('Whether guests can see other guests'),
    privateCopy: z.boolean().optional().describe('Whether this is a private copy of the event'),
    locked: z.boolean().optional().describe('Whether the event is locked'),
    source: calendarEventSourceSchema.optional().describe('Source information for the event'),
    attachments: z
        .array(calendarEventAttachmentSchema)
        .optional()
        .describe('Attachments for the event'),
});

/**
 * The input schema for the create availability tool
 */
export const createAvailabilityInputSchema = z.object({
    timeMinRFC3339: z.string().describe('Start time (RFC3339 format, e.g., 2023-10-27T10:00:00Z)'),
    timeMaxRFC3339: z.string().describe('End time (RFC3339 format, e.g., 2023-10-27T11:00:00Z)'),
    timeDurationMinutes: z.number().describe('Duration of the availability in minutes'),
    responseTimezone: z.string().describe('Timezone to use for the response'),
    eventSummary: z.string().describe('Summary of the event'),
    eventDescription: z.string().describe('Description of the event'),
    eventLocation: z.string().describe('Location of the event'),
    eventAttendees: z.array(z.string().email()).describe('List of attendee email addresses'),
    eventConferenceEnabled: z.boolean().describe('Whether to add Google Meet videoconference'),
    eventIsPrivate: z.boolean().describe('Whether the event is private or public'),
    eventCreateBlock: z.boolean().describe('Whether to create an event for the blocked time'),
});

/**
 * The output schema for the create availability tool (based on BlockAvailabilityResult)
 */
export const createAvailabilityOutputSchema = z.object({
    state: z
        .enum(['success', 'error'])
        .describe('The overall state of the availability creation operation'),
    rescheduledEventCount: z
        .number()
        .optional()
        .describe('The number of events that were rescheduled to create availability'),
    rescheduledEventDetails: z
        .array(calendarEventSchema)
        .optional()
        .describe('Detailed information about the events that were rescheduled'),
    blockEventDetails: calendarEventSchema
        .optional()
        .describe('Details of the blocking event created for the availability period'),
    message: z
        .string()
        .optional()
        .describe('Additional message or error information about the operation'),
});
