import { createTool } from '@mastra/core';
import { z } from 'zod';

const notifyHostPreschedulingFailureInputSchema = z.array(
    z.string().describe('The issue with the scheduling'),
);

const notifyHostPreschedulingFailureOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the email sending'),
});

export const notifyHostPreschedulingFailureTool = createTool({
    id: 'notify-host-prescheduling-failure',
    description: 'Notify the host that the scheduling is failed',
    inputSchema: notifyHostPreschedulingFailureInputSchema,
    outputSchema: notifyHostPreschedulingFailureOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const issues = context;
        console.log(
            `Notifying host that the scheduling is failed for the following issues: ${issues.join(', ')}`,
        );

        return {
            state: 'success' as const,
        };
    },
});
