import { User } from '@/types/api/users';
import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';

/**
 * The input schema for the list events tool
 */
const listEventsInputSchema = z.object({
    timeMin: z
        .string()
        .optional()
        .describe('Start time in ISO format (RFC3339). Defaults to current time'),
    timeMax: z
        .string()
        .optional()
        .describe('End time in ISO format (RFC3339). Defaults to 7 days from now'),
    maxResults: z.number().optional().default(10).describe('Maximum number of events to return'),
    query: z.string().optional().describe('Search query to filter events'),
    options: z
        .object({
            pageToken: z.string().optional().describe('Token for pagination'),
            q: z.string().optional().describe('Search query to filter events'),
            showDeleted: z.boolean().optional().describe('Whether to include deleted events'),
            singleEvents: z.boolean().optional().describe('Whether to expand recurring events'),
            orderBy: z.enum(['startTime', 'updated']).optional().describe('Order of events'),
            timeZone: z.string().optional().describe('Time zone for event times'),
            alwaysIncludeEmail: z
                .boolean()
                .optional()
                .describe('Whether to always include email addresses'),
            iCalUID: z.string().optional().describe('iCal UID to filter events'),
        })
        .optional()
        .describe('Additional options for listing events'),
});

/**
 * The output schema for the list events tool
 */
const listEventsOutputSchema = z.object({
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
                conferenceData: z.any().optional().describe('Conference data'),
            }),
        )
        .describe('List of events'),
    nextPageToken: z.string().optional().describe('Token for next page of results'),
    calendarId: z.string().optional().describe('The calendar ID where events were retrieved from'),
});

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
