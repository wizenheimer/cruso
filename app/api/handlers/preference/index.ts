import { Context } from 'hono';
import { db } from '@/db';
import { workingHours } from '@/db/schema/working-hours';
import { eq } from 'drizzle-orm';
import { preferenceService } from '@/services/preferences';
import { generatePreferencesMarkdown, type PreferencesData } from '@/lib/preference';
import { USER_MIDDLEWARE_CONTEXT_KEY } from '@/constants/middleware';

export const getUser = (c: Context) => {
    const user = c.get(USER_MIDDLEWARE_CONTEXT_KEY);
    if (!user) {
        throw new Error('User not found in context');
    }
    return user;
};

/**
 * Handle GET request to fetch user preferences
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with user preferences or error message
 */
export async function handleGetPreferences(requestContext: Context) {
    console.log('[HANDLER] Getting preferences for user');
    try {
        const authenticatedUser = getUser(requestContext);

        const preferencesResult = await preferenceService.getOrCreatePreferences(
            authenticatedUser.id,
        );

        if (!preferencesResult.success) {
            console.log('[HANDLER] Failed to get or create preferences:', preferencesResult.error);
            return requestContext.json({ error: preferencesResult.error }, 500);
        }

        console.log('[HANDLER] Preferences retrieved successfully');
        return requestContext.json(preferencesResult.data);
    } catch (fetchPreferencesError) {
        console.error('[HANDLER] Error fetching preferences:', fetchPreferencesError);
        return requestContext.json({ error: 'Failed to fetch preferences' }, 500);
    }
}

/**
 * Handle POST request to create user preferences
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with created preferences or error message
 */
export async function handleCreatePreferences(requestContext: Context) {
    console.log('[HANDLER] Creating preferences for user');
    try {
        const authenticatedUser = getUser(requestContext);
        // Note: request body is not used for default preferences creation
        await requestContext.req.json(); // Consume the request body

        const createPreferencesResult = await preferenceService.createDefaultPreferences(
            authenticatedUser.id,
        );

        if (!createPreferencesResult.success) {
            console.log('[HANDLER] Failed to create preferences:', createPreferencesResult.error);
            return requestContext.json({ error: createPreferencesResult.error }, 400);
        }

        console.log('[HANDLER] Preferences created successfully for user');
        return requestContext.json(createPreferencesResult.data, 201);
    } catch (createPreferencesError) {
        console.error('Error creating preferences:', createPreferencesError);
        return requestContext.json({ error: 'Failed to create preferences' }, 500);
    }
}

/**
 * Handle PATCH request to update user preferences
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with updated preferences or error message
 */
export async function handleUpdatePreferences(requestContext: Context) {
    console.log('[HANDLER] Updating preferences for user');
    try {
        const authenticatedUser = getUser(requestContext);
        const preferencesUpdatePayload = await requestContext.req.json();

        const updatePreferencesResult = await preferenceService.updatePreferences(
            authenticatedUser.id,
            preferencesUpdatePayload,
        );

        if (!updatePreferencesResult.success) {
            console.log('[HANDLER] Failed to update preferences:', updatePreferencesResult.error);
            return requestContext.json({ error: updatePreferencesResult.error }, 400);
        }

        console.log('[HANDLER] Preferences updated successfully for user');
        return requestContext.json(updatePreferencesResult.data);
    } catch (updatePreferencesError) {
        console.error('Error updating preferences:', updatePreferencesError);
        return requestContext.json({ error: 'Failed to update preferences' }, 500);
    }
}

/**
 * Handle DELETE request to delete user preferences
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with deletion result or error message
 */
export async function handleDeletePreferences(requestContext: Context) {
    console.log('[HANDLER] Deleting preferences for user');
    try {
        const authenticatedUser = getUser(requestContext);

        const deletePreferencesResult = await preferenceService.deletePreferences(
            authenticatedUser.id,
        );

        if (!deletePreferencesResult.success) {
            console.log('[HANDLER] Failed to delete preferences:', deletePreferencesResult.error);
            return requestContext.json({ error: deletePreferencesResult.error }, 400);
        }

        console.log('[HANDLER] Preferences deleted successfully for user');
        return requestContext.json({ success: true });
    } catch (deletePreferencesError) {
        console.error('Error deleting preferences:', deletePreferencesError);
        return requestContext.json({ error: 'Failed to delete preferences' }, 500);
    }
}

/**
 * Handle POST request to generate preferences document
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with generated document or error message
 */
export async function handleGeneratePreferencesDocument(requestContext: Context) {
    console.log('[HANDLER] Generating preferences document for user');
    try {
        const authenticatedUser = getUser(requestContext);

        // Get user preferences
        const preferencesResult = await preferenceService.getBasicPreferences(authenticatedUser.id);
        if (!preferencesResult.success || !preferencesResult.data) {
            console.log('[HANDLER] Failed to get preferences:', preferencesResult.error);
            return requestContext.json({ error: 'Preferences not found' }, 404);
        }

        const userPreferences = preferencesResult.data;

        // Get user working hours
        const userWorkingHours = await db
            .select({
                days: workingHours.days,
                startTime: workingHours.startTime,
                endTime: workingHours.endTime,
            })
            .from(workingHours)
            .where(eq(workingHours.userId, authenticatedUser.id))
            .orderBy(workingHours.createdAt);

        // Prepare data for document generation
        const preferencesData: PreferencesData = {
            displayName: userPreferences.displayName || undefined,
            nickname: userPreferences.nickname || undefined,
            workingHours: userWorkingHours.map((avail) => ({
                days: avail.days || [],
                startTime: avail.startTime,
                endTime: avail.endTime,
            })),
            defaultTimezone: userPreferences.timezone || undefined,
            minNoticeMinutes: userPreferences.minNoticeMinutes || undefined,
            defaultMeetingDurationMinutes:
                userPreferences.defaultMeetingDurationMinutes || undefined,
            virtualBufferMinutes: userPreferences.virtualBufferMinutes || undefined,
            inPersonBufferMinutes: userPreferences.inPersonBufferMinutes || undefined,
            backToBackBufferMinutes: userPreferences.backToBackBufferMinutes || undefined,
            flightBufferMinutes: userPreferences.flightBufferMinutes || undefined,
        };

        // Generate the markdown document
        const document = generatePreferencesMarkdown(preferencesData);

        // Update the preferences with the generated document
        const updateResult = await preferenceService.updatePreferences(authenticatedUser.id, {
            document,
        });

        if (!updateResult.success) {
            console.log(
                '[HANDLER] Failed to update preferences with document:',
                updateResult.error,
            );
            return requestContext.json({ error: 'Failed to save generated document' }, 500);
        }

        console.log('[HANDLER] Preferences document generated and saved successfully');
        return requestContext.json({
            success: true,
            document,
            data: updateResult.data,
        });
    } catch (error) {
        console.error('[HANDLER] Error generating preferences document:', error);
        return requestContext.json({ error: 'Failed to generate preferences document' }, 500);
    }
}

/**
 * Handle PATCH request to update user preferences document
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with updated preferences or error message
 */
export async function handleUpdatePreferencesDocument(requestContext: Context) {
    console.log('[HANDLER] Updating preferences document for user');

    try {
        const authenticatedUser = getUser(requestContext);
        const preferencesUpdatePayload = await requestContext.req.json();

        const updatePreferencesResult = await preferenceService.updatePreferencesDocument(
            authenticatedUser.id,
            preferencesUpdatePayload.document,
        );

        if (!updatePreferencesResult.success) {
            console.log(
                '[HANDLER] Failed to update preferences document:',
                updatePreferencesResult.error,
            );
            return requestContext.json({ error: updatePreferencesResult.error }, 400);
        }

        console.log(
            '[HANDLER] Preferences document updated successfully for user:',
            authenticatedUser.id,
        );
        return requestContext.json(updatePreferencesResult.data);
    } catch (updatePreferencesDocumentError) {
        console.error('Error updating preferences document:', updatePreferencesDocumentError);
        return requestContext.json({ error: 'Failed to update preferences document' }, 500);
    }
}
/**
 * Handle PATCH request to update primary user email
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with updated preferences or error message
 */
export async function handleUpdatePrimaryEmail(requestContext: Context) {
    console.log('[HANDLER] Updating primary email for user');
    try {
        const authenticatedUser = getUser(requestContext);
        const primaryEmailUpdatePayload = await requestContext.req.json();

        if (primaryEmailUpdatePayload.primaryUserEmailId === undefined) {
            return requestContext.json({ error: 'primaryUserEmailId is required' }, 400);
        }

        const updatePrimaryEmailResult = await preferenceService.updatePrimaryEmail(
            authenticatedUser.id,
            primaryEmailUpdatePayload.primaryUserEmailId,
        );

        if (!updatePrimaryEmailResult.success) {
            console.log(
                '[HANDLER] Failed to update primary email:',
                updatePrimaryEmailResult.error,
            );
            return requestContext.json({ error: updatePrimaryEmailResult.error }, 400);
        }

        console.log('[HANDLER] Primary email updated successfully for user');
        return requestContext.json(updatePrimaryEmailResult.data);
    } catch (updatePrimaryEmailError) {
        console.error('Error updating primary email:', updatePrimaryEmailError);
        return requestContext.json({ error: 'Failed to update primary email' }, 500);
    }
}

/**
 * Handle PATCH request to update primary account
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with updated preferences or error message
 */
export async function handleUpdatePrimaryAccount(requestContext: Context) {
    console.log('[HANDLER] Updating primary account for user');
    try {
        const authenticatedUser = getUser(requestContext);
        const primaryAccountUpdatePayload = await requestContext.req.json();

        if (primaryAccountUpdatePayload.primaryAccountId === undefined) {
            return requestContext.json({ error: 'primaryAccountId is required' }, 400);
        }

        const updatePrimaryAccountResult = await preferenceService.updatePrimaryAccount(
            authenticatedUser.id,
            primaryAccountUpdatePayload.primaryAccountId,
        );

        if (!updatePrimaryAccountResult.success) {
            console.log(
                '[HANDLER] Failed to update primary account:',
                updatePrimaryAccountResult.error,
            );
            return requestContext.json({ error: updatePrimaryAccountResult.error }, 400);
        }

        console.log(
            '[HANDLER] Primary account updated successfully for user:',
            authenticatedUser.id,
        );
        return requestContext.json(updatePrimaryAccountResult.data);
    } catch (updatePrimaryAccountError) {
        console.error('Error updating primary account:', updatePrimaryAccountError);
        return requestContext.json({ error: 'Failed to update primary account' }, 500);
    }
}

/**
 * Handle GET request to fetch available primary options
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with primary options or error message
 */
export async function handleGetPrimaryOptions(requestContext: Context) {
    console.log('[HANDLER] Getting primary options for user');
    try {
        const authenticatedUser = getUser(requestContext);

        const primaryOptionsResult = await preferenceService.getPrimaryOptions(
            authenticatedUser.id,
        );

        if (!primaryOptionsResult.success) {
            console.log('[HANDLER] Failed to get primary options:', primaryOptionsResult.error);
            return requestContext.json({ error: primaryOptionsResult.error }, 500);
        }

        console.log('[HANDLER] Primary options retrieved successfully');
        return requestContext.json(primaryOptionsResult.data);
    } catch (fetchPrimaryOptionsError) {
        console.error('[HANDLER] Error fetching primary options:', fetchPrimaryOptionsError);
        return requestContext.json({ error: 'Failed to fetch primary options' }, 500);
    }
}
