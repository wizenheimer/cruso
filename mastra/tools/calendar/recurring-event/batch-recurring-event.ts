import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { createTool } from '@mastra/core/tools';
import z from 'zod';
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

const batchRecurringEventInputSchema = z.object({
    events: z
        .array(
            z.object({
                title: z.string().describe('Event title'),
                start: z
                    .string()
                    .describe('Start time (RFC3339 format, e.g., 2023-10-27T10:00:00Z)'),
                end: z.string().describe('End time (RFC3339 format, e.g., 2023-10-27T11:00:00Z)'),
                location: z.string().optional().describe('Event location'),
                description: z.string().optional().describe('Event description'),
                attendees: z
                    .array(z.string().email())
                    .optional()
                    .describe('List of attendee email addresses'),
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
                recurrence: z
                    .array(recurrenceRuleSchema)
                    .describe('Recurrence rules for the event'),
            }),
        )
        .describe('Array of recurring events to create'),
    options: z
        .object({
            sendUpdates: z
                .enum(['all', 'externalOnly', 'none'])
                .optional()
                .describe('How to send updates to attendees'),
            conferenceDataVersion: z.number().optional().describe('Conference data version'),
        })
        .optional()
        .describe('Batch creation options'),
});

const batchRecurringEventOutputSchema = z.object({
    successful: z
        .array(
            z.object({
                event: z
                    .object({
                        title: z.string().describe('Event title'),
                        start: z.string().describe('Start time'),
                        end: z.string().describe('End time'),
                        location: z.string().optional().describe('Event location'),
                        description: z.string().optional().describe('Event description'),
                        attendees: z
                            .array(z.string().email())
                            .optional()
                            .describe('List of attendee email addresses'),
                        recurrence: z
                            .array(recurrenceRuleSchema)
                            .describe('Recurrence rules for the event'),
                    })
                    .describe('The event that was created'),
                result: z
                    .object({
                        eventId: z.string().describe('Created event ID'),
                        eventTitle: z.string().describe('Created event title'),
                        eventStart: z.string().describe('Created event start time'),
                        eventEnd: z.string().describe('Created event end time'),
                        eventLocation: z.string().optional().describe('Created event location'),
                        eventDescription: z
                            .string()
                            .optional()
                            .describe('Created event description'),
                        eventAttendees: z
                            .array(z.string().email())
                            .optional()
                            .describe('Created event attendees'),
                        eventRecurrence: z
                            .array(recurrenceRuleSchema)
                            .optional()
                            .describe('Created event recurrence rules'),
                        calendarId: z.string().describe('Calendar ID where event was created'),
                    })
                    .describe('Result of the successful creation'),
            }),
        )
        .describe('Successfully created events'),
    failed: z
        .array(
            z.object({
                event: z
                    .object({
                        title: z.string().describe('Event title'),
                        start: z.string().describe('Start time'),
                        end: z.string().describe('End time'),
                        location: z.string().optional().describe('Event location'),
                        description: z.string().optional().describe('Event description'),
                        attendees: z
                            .array(z.string().email())
                            .optional()
                            .describe('List of attendee email addresses'),
                        recurrence: z
                            .array(recurrenceRuleSchema)
                            .describe('Recurrence rules for the event'),
                    })
                    .describe('The event that failed to create'),
                error: z.string().describe('Error message'),
            }),
        )
        .describe('Failed event creations'),
});

export const batchRecurringEventTool = createTool({
    id: 'batch-recurring-event',
    description: 'Batch create recurring events in google calendar for the current user',
    inputSchema: batchRecurringEventInputSchema,
    outputSchema: batchRecurringEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { events, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        const calendarService = new GoogleCalendarService(user.id);

        // Convert input events to CalendarEvent format with recurrence
        const calendarEvents: Array<CalendarEvent & { recurrence?: RecurrenceRule[] }> = events.map(
            (event) => ({
                summary: event.title,
                description: event.description,
                start: event.allDay ? { date: event.start } : { dateTime: event.start },
                end: event.allDay ? { date: event.end } : { dateTime: event.end },
                location: event.location,
                attendees: event.attendees?.map((email) => ({ email })),
                recurrence: event.recurrence.map((rule) => ({
                    ...rule,
                    dtstart: rule.dtstart ? new Date(rule.dtstart) : undefined,
                    until: rule.until ? new Date(rule.until) : undefined,
                })),
                // Add conference data if requested
                ...(event.conferenceData && {
                    conferenceData: {
                        createRequest: {
                            requestId: `meet-${Date.now()}-${Math.random()}`,
                            conferenceSolutionKey: {
                                type: 'hangoutsMeet',
                            },
                        },
                    },
                }),
            }),
        );

        const results = await calendarService.batchCreateRecurringEventsInPrimaryCalendar(
            calendarEvents,
            options,
        );

        // Transform results to match output schema
        return {
            successful: results.successful.map(({ event, result }) => ({
                event: {
                    title: event.summary,
                    start: event.start.dateTime || event.start.date || '',
                    end: event.end.dateTime || event.end.date || '',
                    location: event.location,
                    description: event.description,
                    attendees: event.attendees?.map((a) => a.email),
                    recurrence: Array.isArray(event.recurrence)
                        ? event.recurrence
                              .filter((rule) => typeof rule === 'object')
                              .map((rule) => ({
                                  ...rule,
                                  dtstart: rule.dtstart?.toISOString(),
                                  until: rule.until?.toISOString(),
                              }))
                        : [],
                },
                result: {
                    eventId: result.id || '',
                    eventTitle: result.summary,
                    eventStart: result.start.dateTime || result.start.date || '',
                    eventEnd: result.end.dateTime || result.end.date || '',
                    eventLocation: result.location,
                    eventDescription: result.description,
                    eventAttendees: result.attendees?.map((a) => a.email),
                    eventRecurrence: Array.isArray(result.recurrence)
                        ? result.recurrence
                              .filter((rule) => typeof rule === 'object')
                              .map((rule) => ({
                                  ...rule,
                                  dtstart: rule.dtstart?.toISOString(),
                                  until: rule.until?.toISOString(),
                              }))
                        : [],
                    calendarId: (result as any).calendarId || '',
                },
            })),
            failed: results.failed.map(({ event, error }) => ({
                event: {
                    title: event.summary,
                    start: event.start.dateTime || event.start.date || '',
                    end: event.end.dateTime || event.end.date || '',
                    location: event.location,
                    description: event.description,
                    attendees: event.attendees?.map((a) => a.email),
                    recurrence: Array.isArray(event.recurrence)
                        ? event.recurrence
                              .filter((rule) => typeof rule === 'object')
                              .map((rule) => ({
                                  ...rule,
                                  dtstart: rule.dtstart?.toISOString(),
                                  until: rule.until?.toISOString(),
                              }))
                        : [],
                },
                error,
            })),
        };
    },
});
