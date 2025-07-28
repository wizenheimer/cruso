import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { z } from 'zod';
import { preferenceService } from '@/services/preferences';

// Helper function to log tool execution
const logToolExecution = (toolName: string, input: any, output: any) => {
    console.log('='.repeat(50));
    console.log(`[${toolName}] Input:`, JSON.stringify(input, null, 2));
    console.log(`[${toolName}] Output:`, output);
    console.log('='.repeat(50));
};

/**
 * Get default scheduling preferences
 * @param context - The context of the get instruction
 * @param runtimeContext - The runtime context
 * @returns The result of the preference get
 */
export const getPreferencesTool = createTool({
    id: 'get-preferences',
    description: 'Get default scheduling preferences',
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const result = await preferenceService.getStringifiedPreference(user.id);
        logToolExecution('get-preferences', context, result);
        return result;
    },
});

/**
 * Update default scheduling preferences
 * @param context - The context of the update instruction
 * @param runtimeContext - The runtime context
 * @returns The result of the preference update
 */
export const setPreferencesTool = createTool({
    id: 'set-preferences',
    description: "Update user's default scheduling preferences",
    inputSchema: z.object({
        updateInstruction: z.string(),
    }),
    outputSchema: z.object({
        success: z.boolean(),
        updatedPreferences: z.string(),
    }),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { updateInstruction } = context;
        const result = await preferenceService.updatePreferencesDocumentUsingInstruction(
            user.id,
            updateInstruction,
        );

        const output = {
            success: result.success,
            updatedPreferences: result.data
                ? JSON.stringify(result.data)
                : 'Failed to update preferences',
        };

        logToolExecution('set-preferences', context, output);
        return output;
    },
});
