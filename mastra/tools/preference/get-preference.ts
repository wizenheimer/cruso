import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { stringify } from 'yaml';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { preferenceService } from '@/services/preferences';

const getPreferenceOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the preference update'),
    preference: z
        .string()
        .optional()
        .describe('The updated preference document in markdown format'),
});

export const getPreferenceTool = createTool({
    id: 'get-preference',
    description: 'Get the preference for the current user',
    outputSchema: getPreferenceOutputSchema,
    execute: async ({ runtimeContext }) => {
        const user = getUserFromRuntimeContext(runtimeContext);
        const preference = await preferenceService.getPreferences(user.id);
        if (!preference.success) {
            return {
                state: 'failed' as const,
            };
        }

        // Stringify the preferences as YAML
        const preferenceString = stringify(preference.data);
        return {
            state: 'success' as const,
            preference: preferenceString,
        };
    },
});
