import { createTool } from '@mastra/core';
import { z } from 'zod';

const notifyAttendeeSchedulingFailureInputSchema = z
    .array(
        z.object({
            slotStart: z.string().describe('The start time of alternative slot'),
            slotEnd: z.string().describe('The end time of alternative slot'),
        }),
    )
    .describe('The available slots of the attendee');

const notifyAttendeeSchedulingFailureOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the email sending'),
});

export const notifyAttendeeSchedulingFailureTool = createTool({
    id: 'notify-attendee-scheduling-failure',
    description: 'Notify the attendee that the scheduling is failed',
    inputSchema: notifyAttendeeSchedulingFailureInputSchema,
    outputSchema: notifyAttendeeSchedulingFailureOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const slots = context;
        console.log(
            `Notifying attendee that the scheduling is failed for the following slots: ${slots.join(
                ', ',
            )}`,
        );

        return {
            state: 'success' as const,
        };
    },
});
