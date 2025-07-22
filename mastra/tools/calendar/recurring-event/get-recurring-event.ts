import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import {
    getRecurringEventInputSchema,
    getRecurringEventOutputSchema,
} from '@/types/tools/recurring-event';

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
