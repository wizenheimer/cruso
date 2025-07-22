import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { searchEventsInputSchema, searchEventsOutputSchema } from '@/types/tools/search';

/**
 * Search events in google calendar for the current user with smart filtering
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The search results with matching events
 */
export const searchEventsTool = createTool({
    id: 'search-events',
    description: 'Search events in google calendar for the current user with smart filtering',
    inputSchema: searchEventsInputSchema,
    outputSchema: searchEventsOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const {
            query,
            timeMin,
            timeMax,
            maxResults,
            orderBy,
            expandRecurring,
            includeDeleted,
            timezone,
            attendees,
            organizer,
            status,
            location,
            hasAttendees,
            isAllDay,
            isRecurring,
            duration,
        } = context;

        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log(
            'triggered search events tool',
            {
                query,
                timeMin,
                timeMax,
                maxResults,
                orderBy,
                expandRecurring,
                includeDeleted,
                timezone,
                attendees,
                organizer,
                status,
                location,
                hasAttendees,
                isAllDay,
                isRecurring,
                duration,
            },
            user,
        );

        try {
            const calendarService = new GoogleCalendarService(user.id);

            // Build search options object
            const searchOptions = {
                query,
                timeMin,
                timeMax,
                maxResults,
                orderBy,
                expandRecurring,
                includeDeleted,
                timezone,
                attendees,
                organizer,
                status,
                location,
                hasAttendees,
                isAllDay,
                isRecurring,
                duration,
            };

            const result = await calendarService.searchPrimaryCalendarEvents(searchOptions);

            // Transform CalendarEvent instances to simplified format
            const events = result.events.map((instance) => ({
                id: instance.id || '',
                summary: instance.summary,
                start: instance.start.dateTime || instance.start.date || '',
                end: instance.end.dateTime || instance.end.date || '',
                location: instance.location,
                description: instance.description,
                attendees: instance.attendees?.map((attendee: { email: string }) => attendee.email),
                status: instance.status,
                recurringEventId: instance.recurringEventId,
                originalStartTime:
                    instance.originalStartTime?.dateTime || instance.originalStartTime?.date,
                iCalUID: instance.iCalUID,
                organizer: instance.organizer
                    ? {
                          email: instance.organizer.email,
                          displayName: instance.organizer.displayName,
                      }
                    : undefined,
                creator: instance.creator
                    ? {
                          email: instance.creator.email,
                          displayName: instance.creator.displayName,
                      }
                    : undefined,
                transparency: instance.transparency,
                visibility: instance.visibility,
                colorId: instance.colorId,
                created: instance.created,
                updated: instance.updated,
            }));

            return {
                state: 'success' as const,
                events: events,
                totalResults: result.totalResults,
                executionTime: result.executionTime,
                nextPageToken: result.nextPageToken,
                searchQuery: query,
                timeRange: {
                    timeMin:
                        timeMin || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                    timeMax:
                        timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                },
            };
        } catch (error) {
            console.error('Failed to search events:', error);
            return {
                state: 'failed' as const,
                events: [],
                totalResults: 0,
                executionTime: 0,
                searchQuery: query,
            };
        }
    },
});
