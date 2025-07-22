import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import {
    searchEventPresetsInputSchema,
    searchEventPresetsOutputSchema,
} from '@/types/tools/search';

/**
 * Search events in google calendar using predefined presets for common search patterns
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The search results with matching events
 */
export const searchEventPresetsTool = createTool({
    id: 'search-event-presets',
    description:
        'Search events in google calendar using predefined presets for common search patterns',
    inputSchema: searchEventPresetsInputSchema,
    outputSchema: searchEventPresetsOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { preset, days, email, minMinutes, query } = context;

        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log(
            'triggered search event presets tool',
            { preset, days, email, minMinutes, query },
            user,
        );

        try {
            const calendarService = new GoogleCalendarService(user.id);
            const presets = calendarService.getQuickSearchPresets();

            let result;
            let searchParameters = {};

            // Execute the appropriate preset based on the input
            switch (preset) {
                case 'todaysMeetings':
                    result = await presets.todaysMeetings();
                    searchParameters = {
                        timeMin: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
                        timeMax: new Date(new Date().setHours(23, 59, 59, 999)).toISOString(),
                        hasAttendees: true,
                        maxResults: 50,
                    };
                    break;

                case 'upcomingWeek':
                    result = await presets.upcomingWeek();
                    searchParameters = {
                        timeMin: new Date().toISOString(),
                        timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        maxResults: 100,
                    };
                    break;

                case 'recentlyCreated':
                    const recentDays = days || 7;
                    result = await presets.recentlyCreated(recentDays);
                    searchParameters = {
                        createdAfter: new Date(
                            Date.now() - recentDays * 24 * 60 * 60 * 1000,
                        ).toISOString(),
                        maxResults: 50,
                    };
                    break;

                case 'withPerson':
                    if (!email) {
                        throw new Error('Email is required for withPerson preset');
                    }
                    const personDays = days || 30;
                    result = await presets.withPerson(email, personDays);
                    searchParameters = {
                        timeMin: new Date().toISOString(),
                        timeMax: new Date(
                            Date.now() + personDays * 24 * 60 * 60 * 1000,
                        ).toISOString(),
                        attendeeEmail: email,
                        maxResults: 50,
                    };
                    break;

                case 'longMeetings':
                    const duration = minMinutes || 60;
                    result = await presets.longMeetings(duration);
                    searchParameters = {
                        timeMin: new Date().toISOString(),
                        timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        minDuration: duration,
                        maxResults: 50,
                    };
                    break;

                case 'recurringEvents':
                    result = await presets.recurringEvents();
                    searchParameters = {
                        timeMin: new Date().toISOString(),
                        timeMax: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                        isRecurring: true,
                        maxResults: 100,
                    };
                    break;

                case 'pastMeetings':
                    const pastDays = days || 30;
                    result = await presets.pastMeetings(pastDays);
                    searchParameters = {
                        timeMin: new Date(
                            Date.now() - pastDays * 24 * 60 * 60 * 1000,
                        ).toISOString(),
                        timeMax: new Date().toISOString(),
                        hasAttendees: true,
                        maxResults: 50,
                    };
                    break;

                case 'freeTextSearch':
                    if (!query) {
                        throw new Error('Query is required for freeTextSearch preset');
                    }
                    result = await presets.freeTextSearch(query);
                    searchParameters = {
                        query: query,
                        maxResults: 50,
                    };
                    break;

                default:
                    throw new Error(`Unknown preset: ${preset}`);
            }

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
                preset: preset,
                events: events,
                totalResults: result.totalResults,
                executionTime: result.executionTime,
                nextPageToken: result.nextPageToken,
                searchParameters: searchParameters,
            };
        } catch (error) {
            console.error('Failed to search events with preset:', error);
            return {
                state: 'failed' as const,
                preset: preset,
                events: [],
                totalResults: 0,
                executionTime: 0,
                searchParameters: {},
            };
        }
    },
});
