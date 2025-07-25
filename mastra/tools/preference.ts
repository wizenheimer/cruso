import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { z } from 'zod';
import { preferenceService } from '@/services/preferences';

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

        return await preferenceService.getStringifiedPreference(user.id);
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

        return {
            success: result.success,
            updatedPreferences: result.data
                ? JSON.stringify(result.data)
                : 'Failed to update preferences',
        };
    },
});
