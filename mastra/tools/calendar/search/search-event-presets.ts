import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';

// CalendarEvent schema based on the CalendarEvent interface
const calendarEventDateTimeSchema = z.object({
    dateTime: z.string().optional().describe('RFC3339 timestamp'),
    date: z.string().optional().describe('Date in YYYY-MM-DD format'),
    timeZone: z.string().optional().describe('IANA timezone identifier'),
});

const calendarEventAttendeeSchema = z.object({
    email: z.string().describe('Attendee email address'),
    displayName: z.string().optional().describe('Attendee display name'),
    responseStatus: z.string().optional().describe('Response status'),
    optional: z.boolean().optional().describe('Whether attendance is optional'),
    resource: z.boolean().optional().describe('Whether this is a resource'),
    organizer: z.boolean().optional().describe('Whether this is the organizer'),
    self: z.boolean().optional().describe('Whether this is the current user'),
    comment: z.string().optional().describe('Attendee comment'),
    additionalGuests: z.number().optional().describe('Number of additional guests'),
});

const calendarEventSchema = z.object({
    id: z.string().describe('Event ID'),
    summary: z.string().describe('Event title/summary'),
    description: z.string().optional().describe('Event description'),
    start: calendarEventDateTimeSchema.describe('Start date and time'),
    end: calendarEventDateTimeSchema.describe('End date and time'),
    attendees: z.array(calendarEventAttendeeSchema).optional().describe('List of event attendees'),
    location: z.string().optional().describe('Event location'),
    reminders: z
        .object({
            useDefault: z.boolean().optional().describe('Use default reminders'),
            overrides: z
                .array(
                    z.object({
                        method: z.string().describe('Reminder method'),
                        minutes: z.number().describe('Minutes before event'),
                    }),
                )
                .optional()
                .describe('Custom reminder overrides'),
        })
        .optional()
        .describe('Reminder settings'),
    // Additional optional fields
    recurringEventId: z.string().optional().describe('ID of the recurring event series'),
    originalStartTime: calendarEventDateTimeSchema
        .optional()
        .describe('Original start time for recurring events'),
    status: z.string().optional().describe('Event status: confirmed, tentative, cancelled'),
    organizer: z
        .object({
            email: z.string().optional().describe('Organizer email'),
            displayName: z.string().optional().describe('Organizer display name'),
            self: z.boolean().optional().describe('Whether current user is organizer'),
        })
        .optional()
        .describe('Event organizer'),
    creator: z
        .object({
            email: z.string().optional().describe('Creator email'),
            displayName: z.string().optional().describe('Creator display name'),
            self: z.boolean().optional().describe('Whether current user is creator'),
        })
        .optional()
        .describe('Event creator'),
    transparency: z.string().optional().describe('Event transparency: opaque, transparent'),
    visibility: z
        .string()
        .optional()
        .describe('Event visibility: default, public, private, confidential'),
    iCalUID: z.string().optional().describe('iCal UID'),
    colorId: z.string().optional().describe('Event color ID'),
    extendedProperties: z
        .object({
            private: z.record(z.string()).optional().describe('Private extended properties'),
            shared: z.record(z.string()).optional().describe('Shared extended properties'),
        })
        .optional()
        .describe('Extended properties'),
});

/**
 * The input schema for the search event presets tool
 */
const searchEventPresetsInputSchema = z.object({
    preset: z
        .enum([
            'todaysMeetings',
            'upcomingWeek',
            'recentlyCreated',
            'withPerson',
            'longMeetings',
            'recurringEvents',
            'pastMeetings',
            'freeTextSearch',
        ])
        .describe('The search preset to use'),
    // Parameters for specific presets
    days: z
        .number()
        .optional()
        .describe('Number of days (for recentlyCreated, withPerson, pastMeetings presets)'),
    email: z.string().email().optional().describe('Email address (for withPerson preset)'),
    minMinutes: z
        .number()
        .optional()
        .describe('Minimum duration in minutes (for longMeetings preset)'),
    query: z.string().optional().describe('Search query (for freeTextSearch preset)'),
});

/**
 * The output schema for the search event presets tool
 */
const searchEventPresetsOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the search operation'),
    preset: z.string().describe('The preset that was used'),
    events: z
        .array(
            z.object({
                id: z.string().describe('Event ID'),
                summary: z.string().describe('Event title/summary'),
                start: z.string().describe('Start time (RFC3339 format)'),
                end: z.string().describe('End time (RFC3339 format)'),
                location: z.string().optional().describe('Event location'),
                description: z.string().optional().describe('Event description'),
                attendees: z
                    .array(z.string())
                    .optional()
                    .describe('List of attendee email addresses'),
                status: z
                    .string()
                    .optional()
                    .describe('Event status: confirmed, tentative, cancelled'),
                recurringEventId: z
                    .string()
                    .optional()
                    .describe('ID of the recurring event series'),
                originalStartTime: z
                    .string()
                    .optional()
                    .describe('Original start time for recurring events'),
                iCalUID: z.string().optional().describe('iCal UID of the event'),
                organizer: z
                    .object({
                        email: z.string().optional().describe('Organizer email'),
                        displayName: z.string().optional().describe('Organizer display name'),
                    })
                    .optional()
                    .describe('Event organizer'),
                creator: z
                    .object({
                        email: z.string().optional().describe('Creator email'),
                        displayName: z.string().optional().describe('Creator display name'),
                    })
                    .optional()
                    .describe('Event creator'),
                transparency: z
                    .string()
                    .optional()
                    .describe('Event transparency: opaque, transparent'),
                visibility: z
                    .string()
                    .optional()
                    .describe('Event visibility: default, public, private, confidential'),
                colorId: z.string().optional().describe('Event color ID'),
                created: z.string().optional().describe('Event creation timestamp'),
                updated: z.string().optional().describe('Event last update timestamp'),
            }),
        )
        .describe('List of matching events'),
    totalResults: z.number().describe('Total number of events found'),
    executionTime: z.number().describe('Search execution time in milliseconds'),
    nextPageToken: z.string().optional().describe('Token for next page of results'),
    searchParameters: z
        .object({
            timeMin: z.string().optional().describe('Start time of search range'),
            timeMax: z.string().optional().describe('End time of search range'),
            query: z.string().optional().describe('Search query used'),
            hasAttendees: z
                .boolean()
                .optional()
                .describe('Whether filtered for events with attendees'),
            isRecurring: z.boolean().optional().describe('Whether filtered for recurring events'),
            minDuration: z.number().optional().describe('Minimum duration filter'),
            attendeeEmail: z.string().optional().describe('Attendee email filter'),
            createdAfter: z.string().optional().describe('Created after filter'),
        })
        .optional()
        .describe('The search parameters that were used'),
});

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
                attendees: instance.attendees?.map((attendee) => attendee.email),
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
