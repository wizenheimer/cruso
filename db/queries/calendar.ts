import { googleAuth } from '@/services/auth/google';
import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { eq, and, desc, sql, isNull, gt, or } from 'drizzle-orm';

export async function getUserGoogleAuth(
    userId: number,
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get the most recent valid token for this user
        const [connection] = await db
            .select()
            .from(calendarConnections)
            .where(
                and(
                    eq(calendarConnections.userId, userId),
                    and(
                        or(
                            isNull(calendarConnections.tokenExpiresAt),
                            gt(calendarConnections.tokenExpiresAt, new Date()),
                        ),
                    ),
                ),
            )
            .orderBy(desc(calendarConnections.updatedAt))
            .limit(1);

        if (!connection || !connection.accessToken) {
            return { success: false, error: 'No valid tokens found for user' };
        }

        await googleAuth.initializeOAuth2Client();
        googleAuth.setUserCredentials(
            connection.accessToken,
            connection.refreshToken || undefined,
            connection.tokenExpiresAt || undefined,
        );

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function refreshUserTokens(
    userId: number,
): Promise<{ success: boolean; error?: string }> {
    try {
        const authResult = await getUserGoogleAuth(userId);
        if (!authResult.success) {
            return authResult;
        }

        const isValid = await googleAuth.validateTokens();

        if (isValid) {
            // Update tokens in database if they were refreshed
            const newCredentials = googleAuth.getCurrentCredentials();
            if (newCredentials.access_token) {
                await db
                    .update(calendarConnections)
                    .set({
                        accessToken: newCredentials.access_token,
                        refreshToken: newCredentials.refresh_token || null,
                        tokenExpiresAt: newCredentials.expiry_date
                            ? new Date(newCredentials.expiry_date)
                            : null,
                        updatedAt: sql`NOW()`,
                    })
                    .where(eq(calendarConnections.userId, userId));
            }

            return { success: true };
        } else {
            return { success: false, error: 'Failed to refresh tokens' };
        }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
