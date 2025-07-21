import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { CalendarEvent, RecurrenceRule } from '@/services/calendar/base';

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
});

/**
 * The input schema for the update future recurring events tool
 */
const updateFutureRecurringEventsInputSchema = z.object({
    eventId: z.string().describe('ID of the recurring event series'),
    fromDateTime: z
        .string()
        .describe('Start time from which to update future instances (RFC3339 format)'),
    summary: z.string().optional().describe('Updated event title'),
    start: z.string().optional().describe('Updated start time (RFC3339 format)'),
    end: z.string().optional().describe('Updated end time (RFC3339 format)'),
    location: z.string().optional().describe('Updated event location'),
    description: z.string().optional().describe('Updated event description'),
    attendees: z
        .array(z.string().email())
        .optional()
        .describe('Updated list of attendee email addresses'),
    recurrence: z
        .array(recurrenceRuleSchema)
        .optional()
        .describe('Updated recurrence rules for the event'),
    allDay: z
        .boolean()
        .optional()
        .describe(
            'Whether this is an all-day event. If true, start/end should be dates like YYYY-MM-DD',
        ),
    options: z
        .object({
            sendUpdates: z
                .enum(['all', 'externalOnly', 'none'])
                .optional()
                .describe('How to send updates to attendees'),
        })
        .optional()
        .describe('Update event options'),
});

/**
 * The output schema for the update future recurring events tool
 */
const updateFutureRecurringEventsOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the future events update'),
    eventId: z.string().optional().describe('The id of the updated recurring event series'),
    eventTitle: z.string().optional().describe('The title of the updated recurring event series'),
    eventStart: z.string().optional().describe('Updated start time (RFC3339 format)'),
    eventEnd: z.string().optional().describe('Updated end time (RFC3339 format)'),
    eventLocation: z.string().optional().describe('Updated event location'),
    eventDescription: z.string().optional().describe('Updated event description'),
    eventAttendees: z
        .array(z.string().email())
        .optional()
        .describe('Updated list of attendee email addresses'),
    eventRecurrence: z
        .array(recurrenceRuleSchema)
        .optional()
        .describe('Updated recurrence rules for the event'),
    eventStatus: z.string().optional().describe('Event status: confirmed, tentative, cancelled'),
    eventOrganizer: z
        .object({
            email: z.string().optional().describe('Organizer email'),
            displayName: z.string().optional().describe('Organizer display name'),
        })
        .optional()
        .describe('Event organizer'),
    eventCreator: z
        .object({
            email: z.string().optional().describe('Creator email'),
            displayName: z.string().optional().describe('Creator display name'),
        })
        .optional()
        .describe('Event creator'),
    eventLink: z.string().optional().describe('Link to the event'),
    eventICalUID: z.string().optional().describe('iCal UID of the event'),
    eventRecurringEventId: z.string().optional().describe('ID of the recurring event series'),
    eventOriginalStartTime: z
        .string()
        .optional()
        .describe('Original start time for recurring events'),
    eventTransparency: z.string().optional().describe('Event transparency: opaque, transparent'),
    eventVisibility: z
        .string()
        .optional()
        .describe('Event visibility: default, public, private, confidential'),
    eventColorId: z.string().optional().describe('Event color ID'),
    eventCreated: z.string().optional().describe('Event creation timestamp'),
    eventUpdated: z.string().optional().describe('Event last update timestamp'),
    calendarId: z
        .string()
        .optional()
        .describe('The calendar ID where the future recurring events were updated'),
});

/**
 * Update future instances of a recurring event in google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The updated recurring event series details
 */
export const updateFutureRecurringEventsTool = createTool({
    id: 'update-future-recurring-events',
    description:
        'Update future instances of a recurring event in google calendar for the current user',
    inputSchema: updateFutureRecurringEventsInputSchema,
    outputSchema: updateFutureRecurringEventsOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const {
            eventId,
            fromDateTime,
            summary,
            start,
            end,
            location,
            description,
            attendees,
            recurrence,
            allDay,
            options,
        } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log(
            'triggered update future recurring events tool',
            eventId,
            fromDateTime,
            summary,
            start,
            end,
            location,
            description,
            attendees,
            recurrence,
            allDay,
            user,
        );

        try {
            const calendarService = new GoogleCalendarService(user.id);

            // Convert input to CalendarEvent format with recurrence support
            const eventUpdates: Partial<CalendarEvent> & { recurrence?: RecurrenceRule[] } = {};

            if (summary !== undefined) eventUpdates.summary = summary;
            if (description !== undefined) eventUpdates.description = description;
            if (location !== undefined) eventUpdates.location = location;

            if (start !== undefined) {
                eventUpdates.start = allDay ? { date: start } : { dateTime: start };
            }
            if (end !== undefined) {
                eventUpdates.end = allDay ? { date: end } : { dateTime: end };
            }

            if (attendees !== undefined) {
                eventUpdates.attendees = attendees.map((email) => ({ email }));
            }

            // Handle recurrence rules - convert string dates to Date objects
            if (recurrence !== undefined) {
                eventUpdates.recurrence = recurrence.map((rule) => ({
                    ...rule,
                    dtstart: rule.dtstart ? new Date(rule.dtstart) : undefined,
                    until: rule.until ? new Date(rule.until) : undefined,
                }));
            }

            const updatedEvent = await calendarService.updateFutureRecurringEventsInPrimaryCalendar(
                eventId,
                fromDateTime,
                eventUpdates,
                options,
            );

            return {
                state: 'success' as const,
                eventId: updatedEvent.id,
                eventTitle: updatedEvent.summary,
                eventStart: updatedEvent.start.dateTime || updatedEvent.start.date || start,
                eventEnd: updatedEvent.end.dateTime || updatedEvent.end.date || end,
                eventLocation: updatedEvent.location,
                eventDescription: updatedEvent.description,
                eventAttendees: updatedEvent.attendees?.map((attendee) => attendee.email),
                eventRecurrence: Array.isArray(updatedEvent.recurrence)
                    ? updatedEvent.recurrence
                          .filter((rule) => typeof rule === 'object')
                          .map((rule) => ({
                              ...rule,
                              dtstart: rule.dtstart?.toISOString(),
                              until: rule.until?.toISOString(),
                          }))
                    : [],
                eventStatus: updatedEvent.status,
                eventOrganizer: updatedEvent.organizer
                    ? {
                          email: updatedEvent.organizer.email,
                          displayName: updatedEvent.organizer.displayName,
                      }
                    : undefined,
                eventCreator: updatedEvent.creator
                    ? {
                          email: updatedEvent.creator.email,
                          displayName: updatedEvent.creator.displayName,
                      }
                    : undefined,
                eventLink: updatedEvent.htmlLink,
                eventICalUID: updatedEvent.iCalUID,
                eventRecurringEventId: updatedEvent.recurringEventId,
                eventOriginalStartTime:
                    updatedEvent.originalStartTime?.dateTime ||
                    updatedEvent.originalStartTime?.date,
                eventTransparency: updatedEvent.transparency,
                eventVisibility: updatedEvent.visibility,
                eventColorId: updatedEvent.colorId,
                eventCreated: updatedEvent.created,
                eventUpdated: updatedEvent.updated,
                calendarId: updatedEvent.calendarId,
            };
        } catch (error) {
            console.error('Failed to update future recurring events:', error);
            return {
                state: 'failed' as const,
                eventId: eventId,
                eventTitle: summary,
                eventStart: start,
                eventEnd: end,
                eventLocation: location,
                eventDescription: description,
                eventAttendees: attendees,
                eventRecurrence: recurrence,
            };
        }
    },
});
