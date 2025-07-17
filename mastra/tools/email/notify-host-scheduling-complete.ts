import { createTool } from '@mastra/core';
import { z } from 'zod';

const notifyHostSchedulingCompleteInputSchema = z.object({
    eventId: z.string().describe('The id of the event created'),
    eventLink: z.string().describe('The link to the event'),
    eventTitle: z.string().describe('Event title'),
    eventStart: z.string().describe('Event start time'),
    eventEnd: z.string().describe('Event end time'),
    eventLocation: z.string().describe('Event location'),
});

const notifyHostSchedulingCompleteOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the email sending'),
});

export const notifyHostSchedulingCompleteTool = createTool({
    id: 'notify-host-scheduling-complete',
    description: 'Notify the host that the scheduling is complete',
    inputSchema: notifyHostSchedulingCompleteInputSchema,
    outputSchema: notifyHostSchedulingCompleteOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { eventId, eventLink, eventTitle, eventStart, eventEnd, eventLocation } = context;
        console.log(`Notifying host that the scheduling is complete for event ${eventId}`);

        return {
            state: 'success' as const,
        };
    },
});
