import z from 'zod';

/**
 * The input schema for the search events tool
 */
export const searchEventsInputSchema = z.object({
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
export const searchEventsOutputSchema = z.object({
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
