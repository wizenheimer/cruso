import { Context } from 'hono';
import { db } from '@/db';
import { preferences } from '@/db/schema/preferences';
import { eq, and } from 'drizzle-orm';
import {
    getUserPreferencesWithPrimaries,
    getUserPreferences,
    createDefaultPreferences,
    updateUserPreferences,
    updatePrimaryUserEmail,
    updatePrimaryAccount,
    getAvailablePrimaryEmails,
    getAvailablePrimaryAccounts,
} from '@/db/queries/preferences';
import { PREFERENCES_DEFAULTS } from '@/lib/preferences-constants';

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

        const userPreferences = await getUserPreferencesWithPrimaries(user.id);

        if (!userPreferences) {
            console.log(
                '[HANDLER] No preferences found for user:',
                user.id,
                'creating default preferences',
            );
            // Create default preferences if none exist
            const defaultPreferences = await createDefaultPreferences(user.id);
            console.log('[HANDLER] Default preferences created successfully');
            return c.json(defaultPreferences);
        }

        console.log('[HANDLER] Existing preferences found and returned');
        return c.json(userPreferences);
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
        const body = await c.req.json();

        // Check if preferences already exist
        const existingPreferences = await getUserPreferences(user.id);

        if (existingPreferences) {
            console.log('[HANDLER] Preferences already exist for user:', user.id);
            return c.json({ error: 'Preferences already exist' }, 400);
        }

        const newPreferences = await db
            .insert(preferences)
            .values({
                userId: user.id,
                document: body.document || PREFERENCES_DEFAULTS.DOCUMENT,
                displayName: body.displayName || PREFERENCES_DEFAULTS.DISPLAY_NAME,
                nickname: body.nickname || PREFERENCES_DEFAULTS.NICKNAME,
                signature: body.signature || PREFERENCES_DEFAULTS.SIGNATURE,
                timezone: body.timezone || PREFERENCES_DEFAULTS.TIMEZONE,
                minNoticeMinutes: body.minNoticeMinutes || PREFERENCES_DEFAULTS.MIN_NOTICE_MINUTES,
                maxDaysAhead: body.maxDaysAhead || PREFERENCES_DEFAULTS.MAX_DAYS_AHEAD,
                defaultMeetingDurationMinutes:
                    body.defaultMeetingDurationMinutes ||
                    PREFERENCES_DEFAULTS.DEFAULT_MEETING_DURATION_MINUTES,
                virtualBufferMinutes:
                    body.virtualBufferMinutes || PREFERENCES_DEFAULTS.VIRTUAL_BUFFER_MINUTES,
                inPersonBufferMinutes:
                    body.inPersonBufferMinutes || PREFERENCES_DEFAULTS.IN_PERSON_BUFFER_MINUTES,
                backToBackBufferMinutes:
                    body.backToBackBufferMinutes ||
                    PREFERENCES_DEFAULTS.BACK_TO_BACK_BUFFER_MINUTES,
                flightBufferMinutes:
                    body.flightBufferMinutes || PREFERENCES_DEFAULTS.FLIGHT_BUFFER_MINUTES,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        console.log('[HANDLER] Preferences created successfully for user:', user.id);
        return c.json(newPreferences[0], 201);
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

        // Check if preferences exist
        const existingPreferences = await getUserPreferences(user.id);

        if (!existingPreferences) {
            console.log('[HANDLER] Preferences not found for user:', user.id);
            return c.json({ error: 'Preferences not found' }, 404);
        }

        const updatedPreferences = await updateUserPreferences(user.id, {
            document: body.document,
            displayName: body.displayName,
            nickname: body.nickname,
            signature: body.signature,
            timezone: body.timezone,
            minNoticeMinutes: body.minNoticeMinutes,
            maxDaysAhead: body.maxDaysAhead,
            defaultMeetingDurationMinutes: body.defaultMeetingDurationMinutes,
            virtualBufferMinutes: body.virtualBufferMinutes,
            inPersonBufferMinutes: body.inPersonBufferMinutes,
            backToBackBufferMinutes: body.backToBackBufferMinutes,
            flightBufferMinutes: body.flightBufferMinutes,
        });

        console.log('[HANDLER] Preferences updated successfully for user:', user.id);
        return c.json(updatedPreferences);
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

        // Check if preferences exist
        const existingPreferences = await getUserPreferences(user.id);

        if (!existingPreferences) {
            console.log('[HANDLER] Preferences not found for user:', user.id);
            return c.json({ error: 'Preferences not found' }, 404);
        }

        // Soft delete - mark as inactive
        await db
            .update(preferences)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(and(eq(preferences.userId, user.id), eq(preferences.isActive, true)));

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

        // Check if preferences exist
        const existingPreferences = await getUserPreferences(user.id);

        if (!existingPreferences) {
            console.log('[HANDLER] Preferences not found for user:', user.id);
            return c.json({ error: 'Preferences not found' }, 404);
        }

        // If primaryUserEmailId is provided, verify it belongs to the user
        if (body.primaryUserEmailId !== null) {
            const availableEmails = await getAvailablePrimaryEmails(user.id);
            const emailExists = availableEmails.some(
                (email) => email.id === body.primaryUserEmailId,
            );

            if (!emailExists) {
                return c.json({ error: 'Email not found or does not belong to user' }, 404);
            }
        }

        const updatedPreferences = await updatePrimaryUserEmail(user.id, body.primaryUserEmailId);

        console.log('[HANDLER] Primary email updated successfully for user:', user.id);
        return c.json(updatedPreferences);
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

        // Check if preferences exist
        const existingPreferences = await getUserPreferences(user.id);

        if (!existingPreferences) {
            console.log('[HANDLER] Preferences not found for user:', user.id);
            return c.json({ error: 'Preferences not found' }, 404);
        }

        // If primaryAccountId is provided, verify it belongs to the user
        if (body.primaryAccountId !== null) {
            const availableAccounts = await getAvailablePrimaryAccounts(user.id);
            const accountExists = availableAccounts.some(
                (account) => account.accountId === body.primaryAccountId,
            );

            if (!accountExists) {
                return c.json({ error: 'Account not found or does not belong to user' }, 404);
            }
        }

        const updatedPreferences = await updatePrimaryAccount(user.id, body.primaryAccountId);

        console.log('[HANDLER] Primary account updated successfully for user:', user.id);
        return c.json(updatedPreferences);
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

        const [availableEmails, availableAccounts] = await Promise.all([
            getAvailablePrimaryEmails(user.id),
            getAvailablePrimaryAccounts(user.id),
        ]);

        console.log('[HANDLER] Primary options retrieved successfully');
        return c.json({
            emails: availableEmails,
            accounts: availableAccounts,
        });
    } catch (error) {
        console.error('[HANDLER] Error fetching primary options:', error);
        return c.json({ error: 'Failed to fetch primary options' }, 500);
    }
}
