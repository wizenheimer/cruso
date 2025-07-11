import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { account } from '@/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { Context } from 'hono';
import { ConnectionManager } from '@/services/calendar/connection';
import { getUser } from './calendar';

/**
 * Extract email from Google ID token
 */
function extractEmailFromGoogleToken(idToken?: string | null): string | null {
    console.log(' [POST_OAUTH] Extracting email from Google ID token...');
    console.log(' [POST_OAUTH] ID token exists:', !!idToken);

    if (!idToken) {
        console.log(' [POST_OAUTH] No ID token provided');
        return null;
    }

    try {
        // Decode the JWT payload (base64 decode the middle part)
        const payload = idToken.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        const email = decodedPayload.email || null;

        console.log(' [POST_OAUTH] Successfully extracted email:', email);
        console.log(' [POST_OAUTH] Full token payload keys:', Object.keys(decodedPayload));

        return email;
    } catch (error) {
        console.error(' [POST_OAUTH] Error extracting email from ID token:', error);
        return null;
    }
}

/**
 * Handle the post-OAuth sync request
 * @param c - The context object
 * @returns The response object
 */
export async function handlePostOAuthSync(c: Context) {
    try {
        const user = getUser(c);
        console.log('\n [POST_OAUTH] Post-OAuth sync requested for user:', user.id);

        // Get all Google accounts for the user that don't have calendar connections yet
        console.log(' [POST_OAUTH] Fetching all Google accounts for user...');
        const googleAccounts = await db
            .select()
            .from(account)
            .where(and(eq(account.userId, user.id), eq(account.providerId, 'google')));

        console.log(' [POST_OAUTH] Found Google accounts:', googleAccounts.length);
        console.log(
            ' [POST_OAUTH] Account details:',
            googleAccounts.map((acc) => ({
                id: acc.id,
                accountId: acc.accountId,
                hasAccessToken: !!acc.accessToken,
                hasIdToken: !!acc.idToken,
            })),
        );

        let syncedAccounts = 0;
        let totalCalendars = 0;

        for (const accountData of googleAccounts) {
            console.log(`\n [POST_OAUTH] Processing account: ${accountData.id}`);

            // Check if this account already has calendar connections
            const existingConnections = await db
                .select()
                .from(calendarConnections)
                .where(eq(calendarConnections.accountId, accountData.id))
                .limit(1);

            if (existingConnections.length > 0) {
                console.log(
                    ` [POST_OAUTH] Account ${accountData.id} already has calendar connections, skipping`,
                );
                continue;
            }

            console.log(' [POST_OAUTH] Syncing new account:', accountData.id);

            if (!accountData.accessToken) {
                console.error(' [POST_OAUTH] No access token for account:', accountData.id);
                continue;
            }

            if (!accountData.accountId) {
                console.error(' [POST_OAUTH] No Google account ID for account:', accountData.id);
                continue;
            }

            try {
                console.log(' [POST_OAUTH] Starting Google email extraction...');
                // Extract Google email from ID token
                const googleEmail = extractEmailFromGoogleToken(accountData.idToken);

                console.log(' [POST_OAUTH] Email extraction result:', {
                    extractedEmail: googleEmail,
                    fallbackAccountId: accountData.accountId,
                    willUse: googleEmail || accountData.accountId,
                });

                console.log(' [POST_OAUTH] Creating ConnectionManager...');
                // Use the ConnectionManager to sync calendars
                const connectionManager = new ConnectionManager({
                    userId: user.id,
                    accountId: accountData.id,
                    googleAccountId: accountData.accountId,
                    googleEmail: googleEmail || accountData.accountId, // Use Google email or fallback to account ID
                });

                console.log(' [POST_OAUTH] Starting calendar sync for account:', accountData.id);
                await connectionManager.syncUserCalendars();

                // Count the calendars that were synced
                console.log(' [POST_OAUTH] Counting synced calendars...');
                const syncedConnections = await db
                    .select()
                    .from(calendarConnections)
                    .where(eq(calendarConnections.accountId, accountData.id));

                totalCalendars += syncedConnections.length;
                syncedAccounts++;

                console.log(
                    ` [POST_OAUTH] Successfully synced ${syncedConnections.length} calendars for account ${accountData.id}`,
                );
            } catch (error) {
                console.error(
                    ' [POST_OAUTH] Error syncing calendars for account:',
                    accountData.id,
                    error,
                );
            }
        }

        console.log(
            `\n [POST_OAUTH] Post-OAuth sync completed. Synced ${syncedAccounts} accounts with ${totalCalendars} calendars`,
        );

        return c.json({
            success: true,
            accountsSynced: syncedAccounts,
            calendarsSynced: totalCalendars,
        });
    } catch (error) {
        console.error(' [POST_OAUTH] Error in post-OAuth sync:', error);
        return c.json({ error: 'Failed to sync calendars' }, 500);
    }
}
