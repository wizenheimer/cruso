import { z } from 'zod';
import { createTool } from '@mastra/core';

const replyHostInputSchema = z.object({
    message: z.string(),
});

const replyHostOutputSchema = z.object({
    status: z.enum(['success', 'error']),
    message: z.string(),
});

export const replyHostTool = createTool({
    id: 'reply-host',
    description: 'Reply to the host of the event',
    inputSchema: replyHostInputSchema,
    outputSchema: replyHostOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { message } = context;
        console.log('Replying to the host', { message });

        return {
            status: 'success' as const,
            message: 'Email sent to the host',
        };
    },
});
