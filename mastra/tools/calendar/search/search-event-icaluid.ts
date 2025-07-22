import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import {
    searchEventByICalUIDInputSchema,
    searchEventByICalUIDOutputSchema,
} from '@/types/tools/search';

/**
 * Search for events by iCalUID across all calendars for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The search results with events grouped by calendar
 */
export const searchEventByICalUIDTool = createTool({
    id: 'search-event-icaluid',
    description: 'Search for events by iCalUID across all calendars for the current user',
    inputSchema: searchEventByICalUIDInputSchema,
    outputSchema: searchEventByICalUIDOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { iCalUID, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log('triggered search event by iCalUID tool', iCalUID, options, user);

        try {
            const calendarService = new GoogleCalendarService(user.id);

            const resultsMap = await calendarService.findEventsByICalUID(iCalUID, options);

            // Transform the Map to the expected output format
            const results = Array.from(resultsMap.entries()).map(([calendarId, events]) => ({
                calendarId,
                events: events.map((event) => ({
                    id: event.id || '',
                    summary: event.summary,
                    start: event.start.dateTime || event.start.date || '',
                    end: event.end.dateTime || event.end.date || '',
                    location: event.location,
                    description: event.description,
                    attendees: event.attendees?.map((attendee) => attendee.email) || [],
                    iCalUID: event.iCalUID || iCalUID,
                    status: event.status,
                })),
            }));

            const totalEvents = results.reduce((sum, result) => sum + result.events.length, 0);
            const totalCalendars = results.length;

            return {
                state: 'success' as const,
                results,
                totalEvents,
                totalCalendars,
            };
        } catch (error) {
            console.error('Failed to search events by iCalUID:', error);
            return {
                state: 'failed' as const,
                results: [],
                totalEvents: 0,
                totalCalendars: 0,
            };
        }
    },
});
