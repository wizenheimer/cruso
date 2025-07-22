import z from 'zod';
import { conferenceDataSchema } from '@/types/services/base';

/**
 * The input schema for the list events tool
 */
export const listEventsInputSchema = z.object({
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
export const listEventsOutputSchema = z.object({
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
                conferenceData: conferenceDataSchema.optional().describe('Conference data'),
            }),
        )
        .describe('List of events'),
    nextPageToken: z.string().optional().describe('Token for next page of results'),
    calendarId: z.string().optional().describe('The calendar ID where events were retrieved from'),
});
