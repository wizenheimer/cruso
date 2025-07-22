import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { rescheduleEventInputSchema, rescheduleEventOutputSchema } from '@/types/tools/event';

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
