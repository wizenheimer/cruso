import z from 'zod';

/**
 * The input schema for the get recurring event instances tool
 */
export const getRecurringEventInstancesInputSchema = z.object({
    eventId: z.string().describe('ID of the recurring event series'),
    timeMin: z.string().describe('Start time for the search range (RFC3339 format)'),
    timeMax: z.string().describe('End time for the search range (RFC3339 format)'),
    options: z
        .object({
            maxResults: z.number().optional().describe('Maximum number of instances to return'),
            pageToken: z.string().optional().describe('Token for next page of results'),
            timeZone: z
                .string()
                .optional()
                .describe('Time zone for the search (IANA timezone identifier)'),
            showDeleted: z.boolean().optional().describe('Whether to include deleted instances'),
        })
        .optional()
        .describe('Search options'),
});

/**
 * The output schema for the get recurring event instances tool
 */
export const getRecurringEventInstancesOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the instances retrieval'),
    instances: z
        .array(
            z.object({
                id: z.string().describe('Event instance ID'),
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
                    .describe('Original start time for this instance'),
                iCalUID: z.string().optional().describe('iCal UID of the event'),
            }),
        )
        .describe('List of recurring event instances'),
    nextPageToken: z.string().optional().describe('Token for next page of results'),
    calendarId: z
        .string()
        .optional()
        .describe('The calendar ID where the instances were retrieved from'),
    totalInstances: z.number().describe('Total number of instances found'),
});
