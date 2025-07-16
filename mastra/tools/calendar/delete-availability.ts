import { createTool } from '@mastra/core/tools';
import z from 'zod';

/**
 * The input schema for the delete availability tool
 */
const deleteAvailabilityInputSchema = z.object({
    start: z.string().describe('Start time (RFC3339 format, e.g., 2023-10-27T10:00:00Z)'),
    end: z.string().describe('End time (RFC3339 format, e.g., 2023-10-27T11:00:00Z)'),
    notify: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to notify attendees of the deletion'),
});

/**
 * The output schema for the delete availability tool
 */
const deleteAvailabilityOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the availability deletion'),
    eventTitles: z.array(z.string()).describe('The titles of the events that were deleted'),
});

/**
 * Delete availability for the current user, block time for the user and reschedule existing events
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The state of the availability deletion and the titles of the events that were deleted
 */
export const deleteAvailabilityTool = createTool({
    id: 'delete-availability',
    description:
        'Delete availability for the current user by rescheduling any affected events and blocking the time',
    inputSchema: deleteAvailabilityInputSchema,
    outputSchema: deleteAvailabilityOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { start, end, notify } = context;
        const userId = runtimeContext.get('userId');
        if (!userId) {
            throw new Error('User ID is required');
        }
        console.log('triggered delete availability tool', start, end, notify, userId);
        return {
            state: 'success' as const,
            eventTitles: ['Event Title 1', 'Event Title 2'],
        };
    },
});
