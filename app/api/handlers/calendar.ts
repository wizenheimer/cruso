import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { account } from '@/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { Context } from 'hono';
import { createCalendarService } from '@/services/calendar/service';

export const getUser = (c: Context) => {
    const user = c.get('user');
    if (!user) {
        throw new Error('User not found in context');
    }
    return user;
};
/**
 * Handle the GET request to fetch calendar connections
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetCalendarConnections(c: Context) {
    try {
        const user = getUser(c);
        const connections = await db
            .select({
                id: calendarConnections.id,
                accountId: calendarConnections.accountId,
                googleAccountId: calendarConnections.googleAccountId,
                googleEmail: calendarConnections.googleEmail,
                calendarName: calendarConnections.calendarName,
                calendarId: calendarConnections.calendarId,
                isPrimary: calendarConnections.isPrimary,
                includeInAvailability: calendarConnections.includeInAvailability,
                isActive: calendarConnections.isActive,
                lastSyncAt: calendarConnections.lastSyncAt,
                syncStatus: calendarConnections.syncStatus,
                errorMessage: calendarConnections.errorMessage,
                createdAt: calendarConnections.createdAt,
            })
            .from(calendarConnections)
            .where(
                and(
                    eq(calendarConnections.userId, user.id),
                    eq(calendarConnections.isActive, true),
                ),
            )
            .orderBy(calendarConnections.isPrimary, calendarConnections.createdAt);

        return c.json(connections);
    } catch (error) {
        console.error('Error fetching calendar connections:', error);
        return c.json({ error: 'Failed to fetch calendar connections' }, 500);
    }
}

/**
 * Handle the GET request to fetch calendar accounts
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetCalendarAccounts(c: Context) {
    try {
        const user = getUser(c);
        // Get all Google accounts for the user with their calendars
        const googleAccounts = await db
            .select({
                accountId: account.id,
                googleAccountId: account.accountId,
                scope: account.scope,
                createdAt: account.createdAt,
            })
            .from(account)
            .where(and(eq(account.userId, user.id), eq(account.providerId, 'google')));

        // Get calendar counts for each account
        const accountsWithCalendars = await Promise.all(
            googleAccounts.map(async (accountData) => {
                const calendars = await db
                    .select()
                    .from(calendarConnections)
                    .where(
                        and(
                            eq(calendarConnections.accountId, accountData.accountId),
                            eq(calendarConnections.isActive, true),
                        ),
                    );

                // Get email from first calendar connection if available
                const email =
                    calendars.length > 0 ? calendars[0].googleEmail : accountData.googleAccountId;

                return {
                    accountId: accountData.accountId,
                    googleAccountId: accountData.googleAccountId,
                    email: email,
                    calendarCount: calendars.length,
                    calendars: calendars.map((cal) => ({
                        id: cal.id,
                        calendarId: cal.calendarId,
                        name: cal.calendarName,
                        isPrimary: cal.isPrimary,
                        includeInAvailability: cal.includeInAvailability,
                        syncStatus: cal.syncStatus,
                    })),
                };
            }),
        );

        return c.json(accountsWithCalendars);
    } catch (error) {
        console.error('Error fetching Google accounts:', error);
        return c.json({ error: 'Failed to fetch Google accounts' }, 500);
    }
}

/**
 * Handle the POST request to sync a calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleSyncCalendar(c: Context) {
    try {
        const connectionId = c.req.param('id');
        const user = getUser(c);

        // Get the connection with its account
        const connectionData = await db
            .select({
                connection: calendarConnections,
                accountData: account,
            })
            .from(calendarConnections)
            .leftJoin(account, eq(calendarConnections.accountId, account.id))
            .where(
                and(
                    eq(calendarConnections.id, connectionId),
                    eq(calendarConnections.userId, user.id),
                    eq(calendarConnections.isActive, true),
                ),
            )
            .limit(1);

        if (connectionData.length === 0) {
            return c.json({ error: 'Connection not found' }, 404);
        }

        const { accountData } = connectionData[0];

        if (!accountData) {
            return c.json({ error: 'Account not found' }, 404);
        }

        try {
            // Use the calendar service to handle token refresh and syncing
            const calendarService = createCalendarService(user.id);

            // Sync all calendars using the service (which handles individual calendar updates)
            const result = await calendarService.syncAllCalendars();

            // Check if the specific calendar was synced successfully
            const syncedCalendar = result.success > 0;

            if (syncedCalendar) {
                return c.json({ success: true, syncedCalendars: result.success });
            } else {
                return c.json(
                    {
                        error: 'Failed to sync calendar',
                        details: result.errors,
                    },
                    500,
                );
            }
        } catch (syncError) {
            // Update error status
            await db
                .update(calendarConnections)
                .set({
                    syncStatus: 'error',
                    errorMessage: syncError instanceof Error ? syncError.message : 'Unknown error',
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(calendarConnections.id, connectionId),
                        eq(calendarConnections.isActive, true),
                    ),
                );

            return c.json({ error: 'Failed to sync calendar' }, 500);
        }
    } catch (error) {
        console.error('Error syncing calendar:', error);
        return c.json({ error: 'Failed to sync calendar' }, 500);
    }
}

/**
 * Handle the PATCH request to update a calendar connection
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdateCalendarConnection(c: Context) {
    try {
        const connectionId = c.req.param('id');
        const user = getUser(c);
        const body = await c.req.json();

        // Validate that the connection belongs to the user
        const connection = await db
            .select()
            .from(calendarConnections)
            .where(
                and(
                    eq(calendarConnections.id, connectionId),
                    eq(calendarConnections.userId, user.id),
                    eq(calendarConnections.isActive, true),
                ),
            )
            .limit(1);

        if (connection.length === 0) {
            return c.json({ error: 'Connection not found' }, 404);
        }

        // Update the connection
        await db
            .update(calendarConnections)
            .set({
                ...body,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(calendarConnections.id, connectionId),
                    eq(calendarConnections.isActive, true),
                ),
            );

        return c.json({ success: true });
    } catch (error) {
        console.error('Error updating calendar connection:', error);
        return c.json({ error: 'Failed to update calendar connection' }, 500);
    }
}

/**
 * Handle the DELETE request to delete a calendar account and all its connections
 * @param c - The context object
 * @returns The response object
 */
export async function handleDeleteCalendarAccount(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();
        const { accountId } = body;

        if (!accountId) {
            return c.json({ error: 'accountId is required' }, 400);
        }

        // Validate that the account belongs to the user
        const accountData = await db
            .select()
            .from(account)
            .where(and(eq(account.id, accountId), eq(account.userId, user.id)))
            .limit(1);

        if (accountData.length === 0) {
            return c.json({ error: 'Account not found' }, 404);
        }

        // Soft delete all calendar connections for this account
        await db
            .update(calendarConnections)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(calendarConnections.accountId, accountId),
                    eq(calendarConnections.isActive, true),
                ),
            );

        // Delete the account
        await db.delete(account).where(eq(account.id, accountId));

        return c.json({ success: true });
    } catch (error) {
        console.error('Error deleting calendar account:', error);
        return c.json({ error: 'Failed to delete calendar account' }, 500);
    }
}

/**
 * Handle the POST request to check availability
 * @param c - The context object
 * @returns The response object
 */
export async function handleCheckAvailability(c: Context) {
    try {
        const user = getUser(c);
        const { startTime, endTime } = await c.req.json();

        if (!startTime || !endTime) {
            return c.json({ error: 'startTime and endTime are required' }, 400);
        }

        // Use calendar service to check availability
        const calendarService = createCalendarService(user.id);

        const availabilityResult = await calendarService.checkAvailability(startTime, endTime);

        const allEvents = availabilityResult.events;

        // Sort events by start time
        allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        // Get the actual number of calendars checked
        const activeConnections = await db
            .select()
            .from(calendarConnections)
            .where(
                and(
                    eq(calendarConnections.userId, user.id),
                    eq(calendarConnections.includeInAvailability, true),
                    eq(calendarConnections.isActive, true),
                ),
            );

        return c.json({
            events: allEvents,
            calendarsChecked: activeConnections.length,
        });
    } catch (error) {
        console.error('Error checking availability:', error);
        return c.json({ error: 'Failed to check availability' }, 500);
    }
}

/**
 * Handle the POST request to sync all calendars
 * @param c - The context object
 * @returns The response object
 */
export async function handleSyncAllCalendars(c: Context) {
    try {
        const user = getUser(c);
        console.log('Manual sync requested for user:', user.id);

        // Use the calendar service to handle token refresh and syncing
        const calendarService = createCalendarService(user.id);

        // Use the new method to fetch all calendar lists
        const result = await calendarService.fetchAllCalendarLists();

        console.log(`Finished manual sync. Total calendars synced: ${result.calendarsSynced}`);

        if (result.errors.length > 0) {
            console.warn('Some errors occurred during sync:', result.errors);
        }

        return c.json({
            success: true,
            accountsSynced: result.accountsSynced,
            calendarsSynced: result.calendarsSynced,
            errors: result.errors,
        });
    } catch (error) {
        console.error('Error in manual sync:', error);
        return c.json({ error: 'Failed to sync calendars' }, 500);
    }
}
