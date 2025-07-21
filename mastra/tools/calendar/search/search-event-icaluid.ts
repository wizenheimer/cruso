import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';

/**
 * The input schema for the search event by iCalUID tool
 */
const searchEventByICalUIDInputSchema = z.object({
    iCalUID: z.string().describe('iCal UID to search for events'),
    options: z
        .object({
            timeZone: z
                .string()
                .optional()
                .describe('Time zone for event times (IANA timezone identifier)'),
            includeDeleted: z
                .boolean()
                .optional()
                .describe('Whether to include deleted events in the search'),
        })
        .optional()
        .describe('Search options'),
});

/**
 * The output schema for the search event by iCalUID tool
 */
const searchEventByICalUIDOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the search operation'),
    results: z
        .array(
            z.object({
                calendarId: z.string().describe('Calendar ID where events were found'),
                events: z
                    .array(
                        z.object({
                            id: z.string().describe('Event ID'),
                            summary: z.string().describe('Event title/summary'),
                            start: z.string().describe('Start time'),
                            end: z.string().describe('End time'),
                            location: z.string().optional().describe('Event location'),
                            description: z.string().optional().describe('Event description'),
                            attendees: z
                                .array(z.string())
                                .optional()
                                .describe('List of attendee email addresses'),
                            iCalUID: z.string().describe('iCal UID of the event'),
                            status: z.string().optional().describe('Event status'),
                        }),
                    )
                    .describe('List of events found in this calendar'),
            }),
        )
        .describe('Search results grouped by calendar'),
    totalEvents: z.number().describe('Total number of events found across all calendars'),
    totalCalendars: z.number().describe('Total number of calendars that contained matching events'),
});

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
