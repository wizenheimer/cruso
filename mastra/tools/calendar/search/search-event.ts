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
 * The input schema for the search events tool
 */
const searchEventsInputSchema = z.object({
    query: z.string().optional().describe('Text search query for events'),
    timeMin: z
        .string()
        .optional()
        .describe('Start time for search range (RFC3339 format, defaults to 90 days ago)'),
    timeMax: z
        .string()
        .optional()
        .describe('End time for search range (RFC3339 format, defaults to 90 days in future)'),
    maxResults: z.number().optional().describe('Maximum number of results to return'),
    orderBy: z.enum(['startTime', 'updated']).optional().describe('Order of results'),
    expandRecurring: z
        .boolean()
        .optional()
        .describe('Whether to expand recurring events into individual instances'),
    includeDeleted: z.boolean().optional().describe('Whether to include deleted events'),
    timezone: z.string().optional().describe('Time zone for the search (IANA timezone identifier)'),
    // Advanced filters
    attendees: z
        .array(z.string().email())
        .optional()
        .describe('Filter by attendee email addresses'),
    organizer: z.string().email().optional().describe('Filter by organizer email'),
    status: z
        .enum(['confirmed', 'tentative', 'cancelled'])
        .optional()
        .describe('Filter by event status'),
    location: z.string().optional().describe('Filter by event location (partial match)'),
    hasAttendees: z.boolean().optional().describe('Filter events that have attendees'),
    isAllDay: z.boolean().optional().describe('Filter all-day events only'),
    isRecurring: z.boolean().optional().describe('Filter recurring events only'),
    duration: z
        .object({
            min: z.number().optional().describe('Minimum duration in minutes'),
            max: z.number().optional().describe('Maximum duration in minutes'),
        })
        .optional()
        .describe('Filter by event duration'),
});

/**
 * The output schema for the search events tool
 */
const searchEventsOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the search operation'),
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
    searchQuery: z.string().optional().describe('The search query that was used'),
    timeRange: z
        .object({
            timeMin: z.string().describe('Start time of search range'),
            timeMax: z.string().describe('End time of search range'),
        })
        .optional()
        .describe('The time range that was searched'),
});

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
