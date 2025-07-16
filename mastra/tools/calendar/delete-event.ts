import { createTool } from '@mastra/core/tools';
import z from 'zod';

const deleteEventInputSchema = z.object({
    eventId: z.string().describe('ID of the event to delete'),
    notifyAttendees: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to notify attendees of the deletion'),
});

const deleteEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event deletion'),
    eventId: z.string().optional().describe('The id of the event deleted'),
    eventTitle: z.string().optional().describe('The title of the event deleted'),
});

export const deleteEventTool = createTool({
    id: 'delete-event',
    description: 'Delete an event from google calendar for the current user',
    inputSchema: deleteEventInputSchema,
    outputSchema: deleteEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { eventId, notifyAttendees } = context;
        const userId = runtimeContext.get('userId');
        if (!userId) {
            throw new Error('User ID is required');
        }
        console.log('triggered delete event tool', eventId, notifyAttendees, userId);
        return {
            state: 'success' as const,
            eventId: eventId,
            eventTitle: 'Event Title',
        };
    },
});
