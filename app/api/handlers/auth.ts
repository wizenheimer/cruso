import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { account } from '@/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { Context } from 'hono';
import { ConnectionManager } from '@/services/calendar/connection';
import { getUser } from './calendar';

/**
 * Handle the post-OAuth sync request
 * @param c - The context object
 * @returns The response object
 */
export async function handlePostOAuthSync(c: Context) {
    try {
        const user = getUser(c);
        console.log('Post-OAuth sync requested for user:', user.id);

        // Get all Google accounts for the user that don't have calendar connections yet
        const googleAccounts = await db
            .select()
            .from(account)
            .where(and(eq(account.userId, user.id), eq(account.providerId, 'google')));

        console.log('Found Google accounts:', googleAccounts.length);

        let syncedAccounts = 0;
        let totalCalendars = 0;

        for (const accountData of googleAccounts) {
            // Check if this account already has calendar connections
            const existingConnections = await db
                .select()
                .from(calendarConnections)
                .where(eq(calendarConnections.accountId, accountData.id))
                .limit(1);

            if (existingConnections.length > 0) {
                console.log(`Account ${accountData.id} already has calendar connections, skipping`);
                continue;
            }

            console.log('Syncing new account:', accountData.id);

            if (!accountData.accessToken) {
                console.error('No access token for account:', accountData.id);
                continue;
            }

            if (!accountData.accountId) {
                console.error('No Google account ID for account:', accountData.id);
                continue;
            }

            try {
                // Use the ConnectionManager to sync calendars
                const connectionManager = new ConnectionManager({
                    userId: user.id,
                    accountId: accountData.id,
                    googleAccountId: accountData.accountId,
                    googleEmail: accountData.accountId, // Use account ID as email fallback
                });

                await connectionManager.syncUserCalendars();

                // Count the calendars that were synced
                const syncedConnections = await db
                    .select()
                    .from(calendarConnections)
                    .where(eq(calendarConnections.accountId, accountData.id));

                totalCalendars += syncedConnections.length;
                syncedAccounts++;

                console.log(
                    `Successfully synced ${syncedConnections.length} calendars for account ${accountData.id}`,
                );
            } catch (error) {
                console.error('Error syncing calendars for account:', accountData.id, error);
            }
        }

        console.log(
            `Post-OAuth sync completed. Synced ${syncedAccounts} accounts with ${totalCalendars} calendars`,
        );

        return c.json({
            success: true,
            accountsSynced: syncedAccounts,
            calendarsSynced: totalCalendars,
        });
    } catch (error) {
        console.error('Error in post-OAuth sync:', error);
        return c.json({ error: 'Failed to sync calendars' }, 500);
    }
}
