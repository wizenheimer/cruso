import { createTool } from '@mastra/core/tools';
import z from 'zod';

const updatePreferenceInputSchema = z.object({
    content: z.array(z.string()).describe('The content of the preference to update'),
});

const updatePreferenceOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the preference update'),
});

export const updatePreferenceTool = createTool({
    id: 'update-preference',
    description: 'Update the preference for the current user',
    inputSchema: updatePreferenceInputSchema,
    outputSchema: updatePreferenceOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { content } = context;
        const userId = runtimeContext.get('userId');
        if (!userId) {
            throw new Error('User ID is required');
        }
        console.log('triggered update preference tool', content, userId);
        return {
            state: 'success' as const,
        };
    },
});
