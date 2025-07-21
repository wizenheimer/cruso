import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';

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

/**
 * The input schema for the get recurring event tool
 */
const getRecurringEventInputSchema = z.object({
    eventId: z.string().describe('ID of the recurring event to retrieve'),
    options: z
        .object({
            timeZone: z
                .string()
                .optional()
                .describe('Time zone for event times (IANA timezone identifier)'),
            alwaysIncludeEmail: z
                .boolean()
                .optional()
                .describe('Whether to always include email addresses'),
            maxAttendees: z.number().optional().describe('Maximum number of attendees to include'),
        })
        .optional()
        .describe('Event retrieval options'),
});

/**
 * The output schema for the get recurring event tool
 */
const getRecurringEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event retrieval'),
    eventId: z.string().optional().describe('The id of the retrieved recurring event'),
    eventTitle: z.string().optional().describe('The title of the retrieved recurring event'),
    eventStart: z.string().optional().describe('Start time (RFC3339 format)'),
    eventEnd: z.string().optional().describe('End time (RFC3339 format)'),
    eventLocation: z.string().optional().describe('Event location'),
    eventDescription: z.string().optional().describe('Event description'),
    eventAttendees: z
        .array(z.string().email())
        .optional()
        .describe('List of attendee email addresses'),
    eventRecurrence: z
        .array(recurrenceRuleSchema)
        .optional()
        .describe('Recurrence rules for the event'),
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
        .describe('The calendar ID where the recurring event was retrieved from'),
});

/**
 * Get a specific recurring event from google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The retrieved recurring event details
 */
export const getRecurringEventTool = createTool({
    id: 'get-recurring-event',
    description: 'Get a specific recurring event from google calendar for the current user',
    inputSchema: getRecurringEventInputSchema,
    outputSchema: getRecurringEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { eventId, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log('triggered get recurring event tool', eventId, options, user);

        try {
            const calendarService = new GoogleCalendarService(user.id);

            const event = await calendarService.getRecurringEventFromPrimaryCalendar(
                eventId,
                options,
            );

            return {
                state: 'success' as const,
                eventId: event.id,
                eventTitle: event.summary,
                eventStart: event.start.dateTime || event.start.date || '',
                eventEnd: event.end.dateTime || event.end.date || '',
                eventLocation: event.location,
                eventDescription: event.description,
                eventAttendees: event.attendees?.map((attendee) => attendee.email),
                eventRecurrence: Array.isArray(event.recurrence)
                    ? event.recurrence
                          .filter((rule) => typeof rule === 'object')
                          .map((rule) => ({
                              ...rule,
                              dtstart: rule.dtstart?.toISOString(),
                              until: rule.until?.toISOString(),
                          }))
                    : [],
                eventStatus: event.status,
                eventOrganizer: event.organizer
                    ? {
                          email: event.organizer.email,
                          displayName: event.organizer.displayName,
                      }
                    : undefined,
                eventCreator: event.creator
                    ? {
                          email: event.creator.email,
                          displayName: event.creator.displayName,
                      }
                    : undefined,
                eventLink: event.htmlLink,
                eventICalUID: event.iCalUID,
                eventRecurringEventId: event.recurringEventId,
                eventOriginalStartTime:
                    event.originalStartTime?.dateTime || event.originalStartTime?.date,
                eventTransparency: event.transparency,
                eventVisibility: event.visibility,
                eventColorId: event.colorId,
                eventCreated: event.created,
                eventUpdated: event.updated,
                calendarId: event.calendarId,
            };
        } catch (error) {
            console.error('Failed to get recurring event:', error);
            return {
                state: 'failed' as const,
                eventId: eventId,
            };
        }
    },
});
