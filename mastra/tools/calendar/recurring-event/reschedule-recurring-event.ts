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
 * The input schema for the reschedule recurring event tool
 */
const rescheduleRecurringEventInputSchema = z.object({
    eventId: z.string().describe('ID of the recurring event to reschedule'),
    startDateTime: z
        .string()
        .describe('New start time (RFC3339 format, e.g., 2023-10-27T10:00:00Z)'),
    endDateTime: z.string().describe('New end time (RFC3339 format, e.g., 2023-10-27T11:00:00Z)'),
    timeZone: z
        .string()
        .describe('Time zone for the event (IANA timezone identifier, e.g., America/New_York)'),
    options: z
        .object({
            sendUpdates: z
                .enum(['all', 'externalOnly', 'none'])
                .optional()
                .describe('How to send updates to attendees'),
        })
        .optional()
        .describe('Reschedule event options'),
});

/**
 * The output schema for the reschedule recurring event tool
 */
const rescheduleRecurringEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event rescheduling'),
    eventId: z.string().optional().describe('The id of the rescheduled recurring event'),
    eventTitle: z.string().optional().describe('The title of the rescheduled recurring event'),
    eventStart: z.string().optional().describe('New start time (RFC3339 format)'),
    eventEnd: z.string().optional().describe('New end time (RFC3339 format)'),
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
        .describe('The calendar ID where the recurring event was rescheduled'),
});

/**
 * Reschedule a recurring event in google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The rescheduled recurring event details
 */
export const rescheduleRecurringEventTool = createTool({
    id: 'reschedule-recurring-event',
    description: 'Reschedule a recurring event in google calendar for the current user',
    inputSchema: rescheduleRecurringEventInputSchema,
    outputSchema: rescheduleRecurringEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { eventId, startDateTime, endDateTime, timeZone, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log(
            'triggered reschedule recurring event tool',
            eventId,
            startDateTime,
            endDateTime,
            timeZone,
            user,
        );

        try {
            const calendarService = new GoogleCalendarService(user.id);

            const rescheduledEvent =
                await calendarService.rescheduleRecurringEventInPrimaryCalendar(
                    eventId,
                    startDateTime,
                    endDateTime,
                    timeZone,
                    options,
                );

            return {
                state: 'success' as const,
                eventId: rescheduledEvent.id,
                eventTitle: rescheduledEvent.summary,
                eventStart:
                    rescheduledEvent.start.dateTime || rescheduledEvent.start.date || startDateTime,
                eventEnd: rescheduledEvent.end.dateTime || rescheduledEvent.end.date || endDateTime,
                eventLocation: rescheduledEvent.location,
                eventDescription: rescheduledEvent.description,
                eventAttendees: rescheduledEvent.attendees?.map((attendee) => attendee.email),
                eventRecurrence: Array.isArray(rescheduledEvent.recurrence)
                    ? rescheduledEvent.recurrence
                          .filter((rule) => typeof rule === 'object')
                          .map((rule) => ({
                              ...rule,
                              dtstart: rule.dtstart?.toISOString(),
                              until: rule.until?.toISOString(),
                          }))
                    : [],
                eventStatus: rescheduledEvent.status,
                eventOrganizer: rescheduledEvent.organizer
                    ? {
                          email: rescheduledEvent.organizer.email,
                          displayName: rescheduledEvent.organizer.displayName,
                      }
                    : undefined,
                eventCreator: rescheduledEvent.creator
                    ? {
                          email: rescheduledEvent.creator.email,
                          displayName: rescheduledEvent.creator.displayName,
                      }
                    : undefined,
                eventLink: rescheduledEvent.htmlLink,
                eventICalUID: rescheduledEvent.iCalUID,
                eventRecurringEventId: rescheduledEvent.recurringEventId,
                eventOriginalStartTime:
                    rescheduledEvent.originalStartTime?.dateTime ||
                    rescheduledEvent.originalStartTime?.date,
                eventTransparency: rescheduledEvent.transparency,
                eventVisibility: rescheduledEvent.visibility,
                eventColorId: rescheduledEvent.colorId,
                eventCreated: rescheduledEvent.created,
                eventUpdated: rescheduledEvent.updated,
                calendarId: rescheduledEvent.calendarId,
            };
        } catch (error) {
            console.error('Failed to reschedule recurring event:', error);
            return {
                state: 'failed' as const,
                eventId: eventId,
                eventStart: startDateTime,
                eventEnd: endDateTime,
            };
        }
    },
});
