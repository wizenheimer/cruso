// mastra/tools/preference.ts
import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '../runtime/context';
import { z } from 'zod';
import { preferenceService } from '@/services/preferences';
import { logToolExecution } from './log';

/**
 * Get default scheduling preferences
 * @param context - The context of the get instruction
 * @param runtimeContext - The runtime context
 * @returns The result of the preference get
 */
export const getSchedulingDefaults = createTool({
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
export const updateSchedulingDefaults = createTool({
    id: 'update-preferences',
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
