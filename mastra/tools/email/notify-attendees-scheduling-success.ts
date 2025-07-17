import { createTool } from '@mastra/core';
import { z } from 'zod';

const notifyAttendeesSchedulingSuccessInputSchema = z.object({
    eventId: z.string().describe('The id of the event created'),
    eventLink: z.string().describe('The link to the event'),
    eventTitle: z.string().describe('Event title'),
    eventStart: z.string().describe('Event start time'),
    eventEnd: z.string().describe('Event end time'),
    eventLocation: z.string().describe('Event location'),
});

const notifyAttendeesSchedulingSuccessOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the email sending'),
});

export const notifyAttendeesSchedulingSuccessTool = createTool({
    id: 'notify-attendees-scheduling-success',
    description: 'Notify the attendees that the scheduling is successful',
    inputSchema: notifyAttendeesSchedulingSuccessInputSchema,
    outputSchema: notifyAttendeesSchedulingSuccessOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { eventId, eventLink, eventTitle, eventStart, eventEnd, eventLocation } = context;
        console.log(`Notifying attendees that the scheduling is successful for event ${eventId}`);

        return {
            state: 'success' as const,
        };
    },
});
