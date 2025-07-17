import { createTool } from '@mastra/core';
import { z } from 'zod';

const notifyHostAvailableSlotsInputSchema = z.object({
    eventId: z.string().describe('The id of the event created'),
    eventLink: z.string().describe('The link to the event'),
    eventTitle: z.string().describe('Event title'),
    eventStart: z.string().describe('Event start time'),
    eventEnd: z.string().describe('Event end time'),
    eventLocation: z.string().describe('Event location'),
});

const notifyHostAvailableSlotsOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the email sending'),
});

export const notifyHostAvailableSlotsTool = createTool({
    id: 'notify-host-available-slots',
    description: 'Notify the host that the available slots are available',
    inputSchema: notifyHostAvailableSlotsInputSchema,
    outputSchema: notifyHostAvailableSlotsOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { eventId, eventLink, eventTitle, eventStart, eventEnd, eventLocation } = context;
        console.log(`Notifying host that the available slots are available for event ${eventId}`);

        return {
            state: 'success' as const,
        };
    },
});
