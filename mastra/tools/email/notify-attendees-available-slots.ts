import { createTool } from '@mastra/core';
import { z } from 'zod';

const notifyAttendeesAvailableSlotsInputSchema = z
    .array(
        z.object({
            slotStart: z.string().describe('The start time of the slot'),
            slotEnd: z.string().describe('The end time of the slot'),
        }),
    )
    .describe('The available slots of the attendee');

const notifyAttendeesAvailableSlotsOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the email sending'),
});

export const notifyAttendeesAvailableSlotsTool = createTool({
    id: 'notify-attendees-available-slots',
    description: 'Notify the attendees that the available slots are available',
    inputSchema: notifyAttendeesAvailableSlotsInputSchema,
    outputSchema: notifyAttendeesAvailableSlotsOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const slots = context;

        for (const slot of slots) {
            const { slotStart, slotEnd } = slot;
            console.log(`Notifying attendee about the available slot ${slotStart} - ${slotEnd}`);
        }
        return { state: 'success' as const };
    },
});
