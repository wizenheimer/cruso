import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { CalendarEvent, RecurrenceRule } from '@/services/calendar/base';
import {
    createRecurringEventInputSchema,
    createRecurringEventOutputSchema,
} from '@/types/tools/recurring-event';

/**
 * Create a new recurring event in google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The created recurring event details
 */
export const createRecurringEventTool = createTool({
    id: 'create-recurring-event',
    description: 'Create a new recurring event in google calendar for the current user',
    inputSchema: createRecurringEventInputSchema,
    outputSchema: createRecurringEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const {
            title,
            start,
            end,
            location,
            description,
            attendees,
            conferenceData,
            allDay,
            recurrence,
            options,
        } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log(
            'triggered create recurring event tool',
            title,
            start,
            end,
            location,
            description,
            attendees,
            conferenceData,
            allDay,
            recurrence,
            user,
        );

        try {
            const calendarService = new GoogleCalendarService(user.id);

            // Convert input to CalendarEvent format with recurrence
            const calendarEvent: CalendarEvent & { recurrence?: RecurrenceRule[] } = {
                summary: title,
                description,
                start: allDay ? { date: start } : { dateTime: start },
                end: allDay ? { date: end } : { dateTime: end },
                location,
                attendees: attendees?.map((email) => ({ email })),
                recurrence: recurrence.map((rule) => ({
                    ...rule,
                    dtstart: rule.dtstart ? new Date(rule.dtstart) : undefined,
                    until: rule.until ? new Date(rule.until) : undefined,
                })),
                // Add conference data if requested
                ...(conferenceData && {
                    conferenceData: {
                        createRequest: {
                            requestId: `meet-${Date.now()}`,
                            conferenceSolutionKey: {
                                type: 'hangoutsMeet',
                            },
                        },
                    },
                }),
            };

            const createdEvent = await calendarService.createRecurringEventInPrimaryCalendar(
                calendarEvent,
                options,
            );

            return {
                state: 'success' as const,
                eventId: createdEvent.id,
                eventLink:
                    createdEvent.htmlLink ||
                    `https://calendar.google.com/event?event=${createdEvent.id}`,
                eventTitle: createdEvent.summary,
                eventStart: createdEvent.start.dateTime || createdEvent.start.date || start,
                eventEnd: createdEvent.end.dateTime || createdEvent.end.date || end,
                eventLocation: createdEvent.location,
                eventDescription: createdEvent.description,
                eventAttendees: createdEvent.attendees?.map((a) => a.email),
                eventConferenceData: conferenceData,
                eventAllDay: allDay,
                eventRecurrence: recurrence,
                calendarId: createdEvent.calendarId,
            };
        } catch (error) {
            console.error('Failed to create recurring event:', error);
            return {
                state: 'failed' as const,
                eventTitle: title,
                eventStart: start,
                eventEnd: end,
                eventLocation: location,
                eventDescription: description,
                eventAttendees: attendees,
                eventConferenceData: conferenceData,
                eventAllDay: allDay,
                eventRecurrence: recurrence,
            };
        }
    },
});
