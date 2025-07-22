import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { CalendarEvent } from '@/services/calendar/base';
import {
    updateRecurringEventInstanceInputSchema,
    updateRecurringEventInstanceOutputSchema,
} from '@/types/tools/recurring-event';

/**
 * Update a specific instance of a recurring event in google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The updated recurring event instance details
 */
export const updateRecurringEventInstanceTool = createTool({
    id: 'update-recurring-event-instance',
    description:
        'Update a specific instance of a recurring event in google calendar for the current user',
    inputSchema: updateRecurringEventInstanceInputSchema,
    outputSchema: updateRecurringEventInstanceOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const {
            eventId,
            instanceStartTime,
            summary,
            start,
            end,
            location,
            description,
            attendees,
            allDay,
            options,
        } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log(
            'triggered update recurring event instance tool',
            eventId,
            instanceStartTime,
            summary,
            start,
            end,
            location,
            description,
            attendees,
            allDay,
            user,
        );

        try {
            const calendarService = new GoogleCalendarService(user.id);

            // Convert input to CalendarEvent format
            const eventUpdates: Partial<CalendarEvent> = {};

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

            const updatedEvent =
                await calendarService.updateRecurringEventInstanceInPrimaryCalendar(
                    eventId,
                    instanceStartTime,
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
            console.error('Failed to update recurring event instance:', error);
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
