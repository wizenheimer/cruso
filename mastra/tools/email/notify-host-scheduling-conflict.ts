import { createTool } from '@mastra/core';
import { z } from 'zod';

const notifyHostSchedulingConflictInputSchema = z.object({
    eventId: z.string().describe('The id of the event created'),
    eventLink: z.string().describe('The link to the event'),
    eventTitle: z.string().describe('Event title'),
    eventStart: z.string().describe('Event start time'),
    eventEnd: z.string().describe('Event end time'),
    eventLocation: z.string().describe('Event location'),
});

const notifyHostSchedulingConflictOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the email sending'),
});

export const notifyHostSchedulingConflictTool = createTool({
    id: 'notify-host-scheduling-conflict',
    description: 'Notify the host that the scheduling is in conflict',
    inputSchema: notifyHostSchedulingConflictInputSchema,
    outputSchema: notifyHostSchedulingConflictOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { eventId, eventLink, eventTitle, eventStart, eventEnd, eventLocation } = context;
        console.log(`Notifying host that the scheduling is in conflict for event ${eventId}`);

        return {
            state: 'success' as const,
        };
    },
});
