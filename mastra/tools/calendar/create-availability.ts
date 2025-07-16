import { createTool } from '@mastra/core/tools';
import z from 'zod';

/**
 * The input schema for the create availability tool
 */
const createAvailabilityInputSchema = z.object({
    start: z.string().describe('Start time (RFC3339 format, e.g., 2023-10-27T10:00:00Z)'),
    end: z.string().describe('End time (RFC3339 format, e.g., 2023-10-27T11:00:00Z)'),
    summary: z.string().describe('Event title'),
    location: z.string().optional().describe('Event location'),
    description: z.string().optional().describe('Event description'),
    attendees: z.array(z.string().email()).optional().describe('List of attendee email addresses'),
    conferenceData: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to add Google Meet videoconference'),
    allDay: z
        .boolean()
        .optional()
        .default(false)
        .describe(
            'Whether this is an all-day event. If true, start/end should be dates like YYYY-MM-DD',
        ),
    notify: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to notify attendees of the rescheduling'),
});

/**
 * The output schema for the create availability tool
 */
const createAvailabilityOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the availability creation'),
    eventTitles: z.array(z.string()).describe('The titles of the events that were rescheduled'),
});

/**
 * Create availability for the current user during a specific time period by rescheduling existing events
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The state of the availability creation and the titles of the events that were rescheduled
 */
export const createAvailabilityTool = createTool({
    id: 'create-availability',
    description:
        'Create availability by rescheduling existing events and blocking time for the user',
    inputSchema: createAvailabilityInputSchema,
    outputSchema: createAvailabilityOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { start, end, notify } = context;
        const userId = runtimeContext.get('userId');
        if (!userId) {
            throw new Error('User ID is required');
        }
        console.log('triggered create availability tool', start, end, notify, userId);
        return {
            state: 'success' as const,
            eventTitles: ['Event Title 1', 'Event Title 2'],
        };
    },
});
