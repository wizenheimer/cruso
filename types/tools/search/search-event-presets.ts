import z from 'zod';

/**
 * The input schema for the search event presets tool
 */
export const searchEventPresetsInputSchema = z.object({
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
export const searchEventPresetsOutputSchema = z.object({
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
