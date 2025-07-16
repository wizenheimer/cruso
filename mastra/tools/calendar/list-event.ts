import { createTool } from '@mastra/core/tools';
import z from 'zod';

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
});

/**
 * The output schema for the list events tool
 */
const listEventsOutputSchema = z.array(
    z.object({
        id: z.string(),
        summary: z.string(),
        start: z.string(),
        end: z.string(),
        location: z.string().optional(),
        description: z.string().optional(),
        attendees: z.array(z.string()).optional(),
        conferenceData: z.any().optional(),
    }),
);

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
        const { timeMin, timeMax, maxResults, query } = context;
        const userId = runtimeContext.get('userId');
        if (!userId) {
            throw new Error('User ID is required');
        }
        console.log('triggered list events tool', timeMin, timeMax, maxResults, query, userId);
        return [];
    },
});
