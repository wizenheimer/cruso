import { Context } from 'hono';
import { db } from '@/db';
import { preferences } from '@/db/schema/preferences';
import { eq, and } from 'drizzle-orm';

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

        const userPreferences = await db
            .select()
            .from(preferences)
            .where(and(eq(preferences.userId, user.id), eq(preferences.isActive, true)))
            .limit(1);

        if (userPreferences.length === 0) {
            console.log(
                '[HANDLER] No preferences found for user:',
                user.id,
                'creating default preferences',
            );
            // Create default preferences if none exist
            const defaultPreferences = await db
                .insert(preferences)
                .values({
                    userId: user.id,
                    document: '',
                    displayName: '',
                    nickname: '',
                    signature: '',
                    timezone: 'America/New_York',
                    minNoticeMinutes: 120,
                    maxDaysAhead: 60,
                    defaultMeetingDurationMinutes: 30,
                    virtualBufferMinutes: 0,
                    inPersonBufferMinutes: 15,
                    backToBackBufferMinutes: 0,
                    flightBufferMinutes: 0,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            console.log('[HANDLER] Default preferences created successfully');
            return c.json(defaultPreferences[0]);
        }

        console.log('[HANDLER] Existing preferences found and returned');
        return c.json(userPreferences[0]);
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
        const existingPreferences = await db
            .select()
            .from(preferences)
            .where(and(eq(preferences.userId, user.id), eq(preferences.isActive, true)))
            .limit(1);

        if (existingPreferences.length > 0) {
            console.log('[HANDLER] Preferences already exist for user:', user.id);
            return c.json({ error: 'Preferences already exist' }, 400);
        }

        const newPreferences = await db
            .insert(preferences)
            .values({
                userId: user.id,
                document: body.document || '',
                displayName: body.displayName || '',
                nickname: body.nickname || '',
                signature: body.signature || '',
                timezone: body.timezone || 'America/New_York',
                minNoticeMinutes: body.minNoticeMinutes || 120,
                maxDaysAhead: body.maxDaysAhead || 60,
                defaultMeetingDurationMinutes: body.defaultMeetingDurationMinutes || 30,
                virtualBufferMinutes: body.virtualBufferMinutes || 0,
                inPersonBufferMinutes: body.inPersonBufferMinutes || 15,
                backToBackBufferMinutes: body.backToBackBufferMinutes || 0,
                flightBufferMinutes: body.flightBufferMinutes || 0,
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
        const existingPreferences = await db
            .select()
            .from(preferences)
            .where(and(eq(preferences.userId, user.id), eq(preferences.isActive, true)))
            .limit(1);

        if (existingPreferences.length === 0) {
            console.log('[HANDLER] Preferences not found for user:', user.id);
            return c.json({ error: 'Preferences not found' }, 404);
        }

        const updatedPreferences = await db
            .update(preferences)
            .set({
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
                updatedAt: new Date(),
            })
            .where(and(eq(preferences.userId, user.id), eq(preferences.isActive, true)))
            .returning();

        console.log('[HANDLER] Preferences updated successfully for user:', user.id);
        return c.json(updatedPreferences[0]);
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
        const existingPreferences = await db
            .select()
            .from(preferences)
            .where(and(eq(preferences.userId, user.id), eq(preferences.isActive, true)))
            .limit(1);

        if (existingPreferences.length === 0) {
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
