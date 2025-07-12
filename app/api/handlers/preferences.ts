import { Context } from 'hono';
import { preferenceService } from '@/services/preferences/service';

export const getUser = (c: Context) => {
    const user = c.get('user');
    if (!user) {
        console.log('[HANDLER] User not found in context');
        throw new Error('User not found in context');
    }
    console.log('[HANDLER] User found:', user.id);
    return user;
};

/**
 * Handle GET request to fetch user preferences
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetPreferences(c: Context) {
    console.log('[HANDLER] Getting preferences for user');
    try {
        const user = getUser(c);

        const result = await preferenceService.getOrCreatePreferences(user.id);

        if (!result.success) {
            console.log('[HANDLER] Failed to get or create preferences:', result.error);
            return c.json({ error: result.error }, 500);
        }

        console.log('[HANDLER] Preferences retrieved successfully');
        return c.json(result.data);
    } catch (error) {
        console.error('[HANDLER] Error fetching preferences:', error);
        return c.json({ error: 'Failed to fetch preferences' }, 500);
    }
}

/**
 * Handle POST request to create user preferences
 * @param c - The context object
 * @returns The response object
 */
export async function handleCreatePreferences(c: Context) {
    console.log('[HANDLER] Creating preferences for user');
    try {
        const user = getUser(c);
        // Note: body is not used for default preferences creation
        await c.req.json(); // Consume the request body

        const result = await preferenceService.createDefaultPreferences(user.id);

        if (!result.success) {
            console.log('[HANDLER] Failed to create preferences:', result.error);
            return c.json({ error: result.error }, 400);
        }

        console.log('[HANDLER] Preferences created successfully for user:', user.id);
        return c.json(result.data, 201);
    } catch (error) {
        console.error('Error creating preferences:', error);
        return c.json({ error: 'Failed to create preferences' }, 500);
    }
}

/**
 * Handle PATCH request to update user preferences
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdatePreferences(c: Context) {
    console.log('[HANDLER] Updating preferences for user');
    try {
        const user = getUser(c);
        const body = await c.req.json();

        const result = await preferenceService.updatePreferences(user.id, body);

        if (!result.success) {
            console.log('[HANDLER] Failed to update preferences:', result.error);
            return c.json({ error: result.error }, 400);
        }

        console.log('[HANDLER] Preferences updated successfully for user:', user.id);
        return c.json(result.data);
    } catch (error) {
        console.error('Error updating preferences:', error);
        return c.json({ error: 'Failed to update preferences' }, 500);
    }
}

/**
 * Handle DELETE request to delete user preferences
 * @param c - The context object
 * @returns The response object
 */
export async function handleDeletePreferences(c: Context) {
    console.log('[HANDLER] Deleting preferences for user');
    try {
        const user = getUser(c);

        const result = await preferenceService.deletePreferences(user.id);

        if (!result.success) {
            console.log('[HANDLER] Failed to delete preferences:', result.error);
            return c.json({ error: result.error }, 404);
        }

        return c.json({ success: true });
    } catch (error) {
        console.error('Error deleting preferences:', error);
        return c.json({ error: 'Failed to delete preferences' }, 500);
    }
}

/**
 * Handle PATCH request to update primary user email
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdatePrimaryEmail(c: Context) {
    console.log('[HANDLER] Updating primary email for user');
    try {
        const user = getUser(c);
        const body = await c.req.json();

        if (body.primaryUserEmailId === undefined) {
            return c.json({ error: 'primaryUserEmailId is required' }, 400);
        }

        const result = await preferenceService.updatePrimaryEmail(user.id, body.primaryUserEmailId);

        if (!result.success) {
            console.log('[HANDLER] Failed to update primary email:', result.error);
            return c.json({ error: result.error }, 400);
        }

        console.log('[HANDLER] Primary email updated successfully for user:', user.id);
        return c.json(result.data);
    } catch (error) {
        console.error('Error updating primary email:', error);
        return c.json({ error: 'Failed to update primary email' }, 500);
    }
}

/**
 * Handle PATCH request to update primary account
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdatePrimaryAccount(c: Context) {
    console.log('[HANDLER] Updating primary account for user');
    try {
        const user = getUser(c);
        const body = await c.req.json();

        if (body.primaryAccountId === undefined) {
            return c.json({ error: 'primaryAccountId is required' }, 400);
        }

        const result = await preferenceService.updatePrimaryAccount(user.id, body.primaryAccountId);

        if (!result.success) {
            console.log('[HANDLER] Failed to update primary account:', result.error);
            return c.json({ error: result.error }, 400);
        }

        console.log('[HANDLER] Primary account updated successfully for user:', user.id);
        return c.json(result.data);
    } catch (error) {
        console.error('Error updating primary account:', error);
        return c.json({ error: 'Failed to update primary account' }, 500);
    }
}

/**
 * Handle GET request to fetch available primary options
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetPrimaryOptions(c: Context) {
    console.log('[HANDLER] Getting primary options for user');
    try {
        const user = getUser(c);

        const result = await preferenceService.getPrimaryOptions(user.id);

        if (!result.success) {
            console.log('[HANDLER] Failed to get primary options:', result.error);
            return c.json({ error: result.error }, 500);
        }

        console.log('[HANDLER] Primary options retrieved successfully');
        return c.json(result.data);
    } catch (error) {
        console.error('[HANDLER] Error fetching primary options:', error);
        return c.json({ error: 'Failed to fetch primary options' }, 500);
    }
}
