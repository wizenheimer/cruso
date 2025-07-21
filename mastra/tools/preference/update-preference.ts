import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { preferenceService } from '@/services/preferences';
import z from 'zod';

const updatePreferenceInputSchema = z.object({
    content: z
        .string()
        .describe(
            'Complete updated preference document without omitting any unaltered sections. The document should be in markdown format.',
        ),
});

const updatePreferenceOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the preference update'),
    updatedPreference: z
        .string()
        .optional()
        .describe('The updated preference document in markdown format'),
});

export const updatePreferenceTool = createTool({
    id: 'update-preference',
    description: 'Update the preference for the current user',
    inputSchema: updatePreferenceInputSchema,
    outputSchema: updatePreferenceOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { content } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        console.log('triggered update preference tool', content, user);
        try {
            const preference = await preferenceService.updatePreferences(user.id, {
                document: content,
            });
            return {
                state: 'success' as const,
                updatedPreference: preference.data?.document ?? '',
            };
        } catch (error) {
            console.error('error updating preference', error);
            return {
                state: 'failed' as const,
            };
        }
    },
});
