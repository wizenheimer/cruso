import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { CalendarEvent, RecurrenceRule } from '@/services/calendar/base';

// CalendarEvent schema based on the CalendarEvent interface
const calendarEventDateTimeSchema = z.object({
    dateTime: z.string().optional().describe('RFC3339 timestamp'),
    date: z.string().optional().describe('Date in YYYY-MM-DD format'),
    timeZone: z.string().optional().describe('IANA timezone identifier'),
});

const calendarEventAttendeeSchema = z.object({
    email: z.string().describe('Attendee email address'),
    displayName: z.string().optional().describe('Attendee display name'),
    responseStatus: z.string().optional().describe('Response status'),
    optional: z.boolean().optional().describe('Whether attendance is optional'),
    resource: z.boolean().optional().describe('Whether this is a resource'),
    organizer: z.boolean().optional().describe('Whether this is the organizer'),
    self: z.boolean().optional().describe('Whether this is the current user'),
    comment: z.string().optional().describe('Attendee comment'),
    additionalGuests: z.number().optional().describe('Number of additional guests'),
});

// RecurrenceRule schema based on the RecurrenceRule interface
const recurrenceRuleSchema = z.object({
    freq: z
        .enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'HOURLY', 'MINUTELY', 'SECONDLY'])
        .describe('Frequency of recurrence'),
    dtstart: z.string().optional().describe('Start date for recurrence (ISO string)'),
    interval: z.number().optional().describe('Interval between recurrences'),
    wkst: z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']).optional().describe('Week start day'),
    count: z.number().optional().describe('Number of occurrences'),
    until: z.string().optional().describe('End date for recurrence (ISO string)'),
    bysetpos: z.array(z.number()).optional().describe('Position within the set'),
    bymonth: z.array(z.number()).optional().describe('Months to include'),
    bymonthday: z.array(z.number()).optional().describe('Days of month to include'),
    byyearday: z.array(z.number()).optional().describe('Days of year to include'),
    byweekno: z.array(z.number()).optional().describe('Week numbers to include'),
    byweekday: z
        .array(z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']))
        .optional()
        .describe('Days of week to include'),
    byhour: z.array(z.number()).optional().describe('Hours to include'),
    byminute: z.array(z.number()).optional().describe('Minutes to include'),
    bysecond: z.array(z.number()).optional().describe('Seconds to include'),
    byeaster: z.number().nullable().optional().describe('Easter offset'),
});

const calendarEventSchema = z.object({
    id: z.string().optional().describe('Event ID'),
    summary: z.string().describe('Event title/summary'),
    description: z.string().optional().describe('Event description'),
    start: calendarEventDateTimeSchema.describe('Start date and time'),
    end: calendarEventDateTimeSchema.describe('End date and time'),
    attendees: z.array(calendarEventAttendeeSchema).optional().describe('List of event attendees'),
    location: z.string().optional().describe('Event location'),
    reminders: z
        .object({
            useDefault: z.boolean().optional().describe('Use default reminders'),
            overrides: z
                .array(
                    z.object({
                        method: z.string().describe('Reminder method'),
                        minutes: z.number().describe('Minutes before event'),
                    }),
                )
                .optional()
                .describe('Custom reminder overrides'),
        })
        .optional()
        .describe('Reminder settings'),
    // Additional optional fields
    recurringEventId: z.string().optional().describe('ID of the recurring event series'),
    originalStartTime: calendarEventDateTimeSchema
        .optional()
        .describe('Original start time for recurring events'),
    status: z.string().optional().describe('Event status: confirmed, tentative, cancelled'),
    organizer: z
        .object({
            email: z.string().optional().describe('Organizer email'),
            displayName: z.string().optional().describe('Organizer display name'),
            self: z.boolean().optional().describe('Whether current user is organizer'),
        })
        .optional()
        .describe('Event organizer'),
    creator: z
        .object({
            email: z.string().optional().describe('Creator email'),
            displayName: z.string().optional().describe('Creator display name'),
            self: z.boolean().optional().describe('Whether current user is creator'),
        })
        .optional()
        .describe('Event creator'),
    transparency: z.string().optional().describe('Event transparency: opaque, transparent'),
    visibility: z
        .string()
        .optional()
        .describe('Event visibility: default, public, private, confidential'),
    iCalUID: z.string().optional().describe('iCal UID'),
    colorId: z.string().optional().describe('Event color ID'),
    extendedProperties: z
        .object({
            private: z.record(z.string()).optional().describe('Private extended properties'),
            shared: z.record(z.string()).optional().describe('Shared extended properties'),
        })
        .optional()
        .describe('Extended properties'),
    recurrence: z.array(recurrenceRuleSchema).optional().describe('Recurrence rules for the event'),
});

/**
 * The input schema for the create recurring event tool
 */
const createRecurringEventInputSchema = z.object({
    title: z.string().describe('Event title'),
    start: z.string().describe('Start time (RFC3339 format, e.g., 2023-10-27T10:00:00Z)'),
    end: z.string().describe('End time (RFC3339 format, e.g., 2023-10-27T11:00:00Z)'),
    location: z.string().optional().describe('Event location'),
    description: z.string().optional().describe('Event description'),
    attendees: z.array(z.string().email()).optional().describe('List of attendee email addresses'),
    conferenceData: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to add Google Meet videoconference'),
    allDay: z
        .boolean()
        .optional()
        .default(false)
        .describe(
            'Whether this is an all-day event. If true, start/end should be dates like YYYY-MM-DD',
        ),
    recurrence: z.array(recurrenceRuleSchema).describe('Recurrence rules for the event'),
    options: z
        .object({
            sendUpdates: z
                .enum(['all', 'externalOnly', 'none'])
                .optional()
                .describe('How to send updates to attendees'),
            conferenceDataVersion: z.number().optional().describe('Conference data version'),
        })
        .optional()
        .describe('Event creation options'),
});

/**
 * The output schema for the create recurring event tool
 */
const createRecurringEventOutputSchema = z.object({
    state: z
        .enum(['soft-conflict', 'hard-conflict', 'success', 'failed'])
        .describe('The state of the event creation'),
    eventId: z.string().optional().describe('The id of the recurring event created'),
    eventLink: z.string().optional().describe('The link to the recurring event'),
    eventTitle: z.string().describe('Event title'),
    eventStart: z.string().describe('Start time (RFC3339 format, e.g., 2023-10-27T10:00:00Z)'),
    eventEnd: z.string().describe('End time (RFC3339 format, e.g., 2023-10-27T11:00:00Z)'),
    eventLocation: z.string().optional().describe('Event location'),
    eventDescription: z.string().optional().describe('Event description'),
    eventAttendees: z
        .array(z.string().email())
        .optional()
        .describe('List of attendee email addresses'),
    eventConferenceData: z
        .boolean()
        .optional()
        .describe('Whether to add Google Meet videoconference'),
    eventAllDay: z
        .boolean()
        .optional()
        .describe(
            'Whether this is an all-day event. If true, start/end should be dates like YYYY-MM-DD',
        ),
    eventRecurrence: z
        .array(recurrenceRuleSchema)
        .optional()
        .describe('Recurrence rules for the event'),
    calendarId: z
        .string()
        .optional()
        .describe('The calendar ID where the recurring event was created'),
});

/**
 * Create a new recurring event in google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The created recurring event details
 */
export const createRecurringEventTool = createTool({
    id: 'create-recurring-event',
    description: 'Create a new recurring event in google calendar for the current user',
    inputSchema: createRecurringEventInputSchema,
    outputSchema: createRecurringEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const {
            title,
            start,
            end,
            location,
            description,
            attendees,
            conferenceData,
            allDay,
            recurrence,
            options,
        } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log(
            'triggered create recurring event tool',
            title,
            start,
            end,
            location,
            description,
            attendees,
            conferenceData,
            allDay,
            recurrence,
            user,
        );

        try {
            const calendarService = new GoogleCalendarService(user.id);

            // Convert input to CalendarEvent format with recurrence
            const calendarEvent: CalendarEvent & { recurrence?: RecurrenceRule[] } = {
                summary: title,
                description,
                start: allDay ? { date: start } : { dateTime: start },
                end: allDay ? { date: end } : { dateTime: end },
                location,
                attendees: attendees?.map((email) => ({ email })),
                recurrence: recurrence.map((rule) => ({
                    ...rule,
                    dtstart: rule.dtstart ? new Date(rule.dtstart) : undefined,
                    until: rule.until ? new Date(rule.until) : undefined,
                })),
                // Add conference data if requested
                ...(conferenceData && {
                    conferenceData: {
                        createRequest: {
                            requestId: `meet-${Date.now()}`,
                            conferenceSolutionKey: {
                                type: 'hangoutsMeet',
                            },
                        },
                    },
                }),
            };

            const createdEvent = await calendarService.createRecurringEventInPrimaryCalendar(
                calendarEvent,
                options,
            );

            return {
                state: 'success' as const,
                eventId: createdEvent.id,
                eventLink:
                    createdEvent.htmlLink ||
                    `https://calendar.google.com/event?event=${createdEvent.id}`,
                eventTitle: createdEvent.summary,
                eventStart: createdEvent.start.dateTime || createdEvent.start.date || start,
                eventEnd: createdEvent.end.dateTime || createdEvent.end.date || end,
                eventLocation: createdEvent.location,
                eventDescription: createdEvent.description,
                eventAttendees: createdEvent.attendees?.map((a) => a.email),
                eventConferenceData: conferenceData,
                eventAllDay: allDay,
                eventRecurrence: recurrence,
                calendarId: createdEvent.calendarId,
            };
        } catch (error) {
            console.error('Failed to create recurring event:', error);
            return {
                state: 'failed' as const,
                eventTitle: title,
                eventStart: start,
                eventEnd: end,
                eventLocation: location,
                eventDescription: description,
                eventAttendees: attendees,
                eventConferenceData: conferenceData,
                eventAllDay: allDay,
                eventRecurrence: recurrence,
            };
        }
    },
});
