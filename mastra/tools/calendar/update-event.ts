import { createTool } from '@mastra/core/tools';
import z from 'zod';

const updateEventInputSchema = z.object({
    eventId: z.string().describe('ID of the event to update'),
    summary: z.string().optional().describe('Updated event title'),
    start: z.string().optional().describe('Updated start time (RFC3339 format)'),
    end: z.string().optional().describe('Updated end time (RFC3339 format)'),
    location: z.string().optional().describe('Updated event location'),
    description: z.string().optional().describe('Updated event description'),
    attendees: z
        .array(z.string().email())
        .optional()
        .describe('Updated list of attendee email addresses'),
    notifyAttendees: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to notify attendees of the update'),
});

const updateEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event update'),
    eventId: z.string().optional().describe('The id of the event updated'),
    eventTitle: z.string().optional().describe('The title of the event updated'),
});

export const updateEventTool = createTool({
    id: 'update-event',
    description: 'Update an event in google calendar for the current user',
    inputSchema: updateEventInputSchema,
    outputSchema: updateEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { eventId, notifyAttendees } = context;
        const userId = runtimeContext.get('userId');
        if (!userId) {
            throw new Error('User ID is required');
        }
        console.log('triggered update event tool', eventId, notifyAttendees, userId);
        return {
            state: 'success' as const,
            eventId: eventId,
            eventTitle: 'Event Title',
        };
    },
});
