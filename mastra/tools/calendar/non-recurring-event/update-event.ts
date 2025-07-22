import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { CalendarEvent, GoogleCalendarService } from '@/services/calendar';
import { updateEventInputSchema, updateEventOutputSchema } from '@/types/tools/non-recurring-event';

export const updateEventTool = createTool({
    id: 'update-event',
    description: 'Update an event in google calendar for the current user',
    inputSchema: updateEventInputSchema,
    outputSchema: updateEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const {
            eventId,
            summary,
            start,
            end,
            location,
            description,
            attendees,
            notifyAttendees,
            options,
        } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log('triggered update event tool', eventId, notifyAttendees, user);

        try {
            const calendarService = new GoogleCalendarService(user.id);

            // Convert input to CalendarEvent format
            const eventUpdates: Partial<CalendarEvent> = {};

            if (summary !== undefined) eventUpdates.summary = summary;
            if (description !== undefined) eventUpdates.description = description;
            if (location !== undefined) eventUpdates.location = location;

            if (start !== undefined) {
                eventUpdates.start = { dateTime: start };
            }
            if (end !== undefined) {
                eventUpdates.end = { dateTime: end };
            }

            if (attendees !== undefined) {
                eventUpdates.attendees = attendees.map((email) => ({ email }));
            }

            // Convert notifyAttendees to sendUpdates option for backward compatibility
            const updateOptions = {
                ...options,
                sendUpdates: options?.sendUpdates || (notifyAttendees ? 'all' : 'none'),
            };

            const updatedEvent = await calendarService.updateEventInPrimaryCalendar(
                eventId,
                eventUpdates,
                updateOptions,
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
                calendarId: updatedEvent.calendarId,
            };
        } catch (error) {
            console.error('Failed to update event:', error);
            return {
                state: 'failed' as const,
                eventId: eventId,
                eventTitle: summary,
                eventStart: start,
                eventEnd: end,
                eventLocation: location,
                eventDescription: description,
                eventAttendees: attendees,
            };
        }
    },
});
