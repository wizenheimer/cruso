import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import {
    rescheduleRecurringEventInputSchema,
    rescheduleRecurringEventOutputSchema,
} from '@/types/tools/recurring-event';

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
