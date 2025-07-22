import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { CalendarEvent, RecurrenceRule } from '@/services/calendar/base';
import {
    updateRecurringEventInputSchema,
    updateRecurringEventOutputSchema,
} from '@/types/tools/recurring-event';

/**
 * Update a recurring event in google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The updated recurring event details
 */
export const updateRecurringEventTool = createTool({
    id: 'update-recurring-event',
    description: 'Update a recurring event in google calendar for the current user',
    inputSchema: updateRecurringEventInputSchema,
    outputSchema: updateRecurringEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const {
            eventId,
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
            'triggered update recurring event tool',
            eventId,
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

            // Convert input to CalendarEvent format with recurrence
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

            if (recurrence !== undefined) {
                eventUpdates.recurrence = recurrence.map((rule) => ({
                    ...rule,
                    dtstart: rule.dtstart ? new Date(rule.dtstart) : undefined,
                    until: rule.until ? new Date(rule.until) : undefined,
                }));
            }

            const updatedEvent = await calendarService.updateRecurringEventInPrimaryCalendar(
                eventId,
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
                    : recurrence,
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
                eventTransparency: updatedEvent.transparency,
                eventVisibility: updatedEvent.visibility,
                eventColorId: updatedEvent.colorId,
                eventCreated: updatedEvent.created,
                eventUpdated: updatedEvent.updated,
                calendarId: updatedEvent.calendarId,
            };
        } catch (error) {
            console.error('Failed to update recurring event:', error);
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
