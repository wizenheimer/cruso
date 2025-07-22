import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { createEventInputSchema, createEventOutputSchema } from '@/types/tools/event';

/**
 * Create a new event in google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The created event details
 */
export const createEventTool = createTool({
    id: 'create-event',
    description: 'Create a new event in google calendar for the current user',
    inputSchema: createEventInputSchema,
    outputSchema: createEventOutputSchema,
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
            options,
        } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log(
            'triggered create event tool',
            title,
            start,
            end,
            location,
            description,
            attendees,
            conferenceData,
            allDay,
            user,
        );

        try {
            const calendarService = new GoogleCalendarService(user.id);

            // Convert input to CalendarEvent format
            const calendarEvent = {
                summary: title,
                description,
                start: allDay ? { date: start } : { dateTime: start },
                end: allDay ? { date: end } : { dateTime: end },
                location,
                attendees: attendees?.map((email) => ({ email })),
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

            const createdEvent = await calendarService.createEventInPrimaryCalendar(
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
                calendarId: createdEvent.calendarId,
            };
        } catch (error) {
            console.error('Failed to create event:', error);
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
            };
        }
    },
});
