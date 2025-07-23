import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { account } from '@/db/schema/auth';
import { eq, and, desc } from 'drizzle-orm';
import { GoogleAuthManager } from '@/services/calendar/auth';

const authManager = new GoogleAuthManager();

export async function getUserGoogleAuth(
    userId: string,
): Promise<{ success: boolean; error?: string; accountId?: string }> {
    try {
        // Get the most recent active calendar connection for this user
        const [connection] = await db
            .select({
                connection: calendarConnections,
                account: account,
            })
            .from(calendarConnections)
            .leftJoin(account, eq(calendarConnections.accountId, account.id))
            .where(
                and(eq(calendarConnections.userId, userId), eq(calendarConnections.isActive, true)),
            )
            .orderBy(desc(calendarConnections.updatedAt))
            .limit(1);

        if (!connection || !connection.account) {
            return { success: false, error: 'No active calendar connection found for user' };
        }

        // Verify the account has valid tokens
        if (!connection.account.accessToken || !connection.account.refreshToken) {
            return { success: false, error: 'No valid tokens found for user' };
        }

        // Test authentication by getting an authenticated client
        try {
            await authManager.getAuthenticatedClient(connection.account.id);
            return { success: true, accountId: connection.account.id };
        } catch (error) {
            return { success: false, error: 'Failed to authenticate with Google' };
        }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function refreshUserTokens(
    userId: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        const authResult = await getUserGoogleAuth(userId);
        if (!authResult.success || !authResult.accountId) {
            return authResult;
        }

        // The GoogleAuthManager automatically handles token refresh
        // Just try to get an authenticated client to trigger refresh if needed
        try {
            await authManager.getAuthenticatedClient(authResult.accountId);
            return { success: true };
        } catch (error) {
            return { success: false, error: 'Failed to refresh tokens' };
        }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function getActiveCalendarConnections(userId: string) {
    return await db
        .select({
            connection: calendarConnections,
            account: account,
        })
        .from(calendarConnections)
        .leftJoin(account, eq(calendarConnections.accountId, account.id))
        .where(and(eq(calendarConnections.userId, userId), eq(calendarConnections.isActive, true)));
}

export async function getCalendarConnectionById(connectionId: string) {
    const [connection] = await db
        .select({
            connection: calendarConnections,
            account: account,
        })
        .from(calendarConnections)
        .leftJoin(account, eq(calendarConnections.accountId, account.id))
        .where(
            and(eq(calendarConnections.id, connectionId), eq(calendarConnections.isActive, true)),
        )
        .limit(1);

    return connection || null;
}
