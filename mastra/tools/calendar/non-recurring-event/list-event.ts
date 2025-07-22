import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { listEventsInputSchema, listEventsOutputSchema } from '@/types/tools/non-recurring-event';

/**
 * List upcoming events from google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The list of events
 */
export const listEventsTool = createTool({
    id: 'list-events',
    description: 'List upcoming events from google calendar for the current user',
    inputSchema: listEventsInputSchema,
    outputSchema: listEventsOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { timeMin, timeMax, maxResults, query, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log('triggered list events tool', timeMin, timeMax, maxResults, query, user);

        try {
            const calendarService = new GoogleCalendarService(user.id);

            // Set default time range if not provided
            const defaultTimeMin = timeMin || new Date().toISOString();
            const defaultTimeMax =
                timeMax || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

            // Prepare options for the API call
            const listOptions = {
                maxResults,
                ...options,
                q: options?.q || query, // Use options.q if provided, otherwise fall back to query
            };

            const result = await calendarService.getEventsFromPrimaryCalendar(
                defaultTimeMin,
                defaultTimeMax,
                listOptions,
            );

            // Transform CalendarEvent objects to the expected output format
            const transformedEvents = result.events.map((event) => ({
                id: event.id || '',
                summary: event.summary,
                start: event.start.dateTime || event.start.date || '',
                end: event.end.dateTime || event.end.date || '',
                location: event.location,
                description: event.description,
                attendees: event.attendees?.map((attendee) => attendee.email) || [],
                conferenceData: event.conferenceData,
            }));

            return {
                events: transformedEvents,
                nextPageToken: result.nextPageToken,
                calendarId: result.calendarId,
            };
        } catch (error) {
            console.error('Failed to list events:', error);
            return {
                events: [],
                calendarId: undefined,
            };
        }
    },
});
