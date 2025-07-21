import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';

/**
 * The input schema for the reschedule event tool
 */
const rescheduleEventInputSchema = z.object({
    eventId: z.string().describe('ID of the event to reschedule'),
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
 * The output schema for the reschedule event tool
 */
const rescheduleEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event rescheduling'),
    eventId: z.string().optional().describe('The id of the rescheduled event'),
    eventTitle: z.string().optional().describe('The title of the rescheduled event'),
    eventStart: z.string().optional().describe('New start time (RFC3339 format)'),
    eventEnd: z.string().optional().describe('New end time (RFC3339 format)'),
    eventLocation: z.string().optional().describe('Event location'),
    eventDescription: z.string().optional().describe('Event description'),
    eventAttendees: z
        .array(z.string().email())
        .optional()
        .describe('List of attendee email addresses'),
    calendarId: z.string().optional().describe('The calendar ID where the event was rescheduled'),
});

/**
 * Reschedule an event in google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The rescheduled event details
 */
export const rescheduleEventTool = createTool({
    id: 'reschedule-event',
    description: 'Reschedule an existing event in google calendar for the current user',
    inputSchema: rescheduleEventInputSchema,
    outputSchema: rescheduleEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { eventId, startDateTime, endDateTime, timeZone, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log(
            'triggered reschedule event tool',
            eventId,
            startDateTime,
            endDateTime,
            timeZone,
            user,
        );

        try {
            const calendarService = new GoogleCalendarService(user.id);

            const rescheduledEvent = await calendarService.rescheduleEventInPrimaryCalendar(
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
                calendarId: rescheduledEvent.calendarId,
            };
        } catch (error) {
            console.error('Failed to reschedule event:', error);
            return {
                state: 'failed' as const,
                eventId: eventId,
                eventStart: startDateTime,
                eventEnd: endDateTime,
            };
        }
    },
});
