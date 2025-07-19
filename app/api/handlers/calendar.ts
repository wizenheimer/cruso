import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { account } from '@/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { Context } from 'hono';
import { createCalendarService } from '@/services/calendar/service';
import { updatePrimaryAccount } from '@/db/queries/preferences';

/**
 * Extract the authenticated user from the request context
 * @param requestContext - The Hono context object containing request data
 * @returns The authenticated user object
 * @throws Error if user is not found in context
 */
export const getUser = (requestContext: Context) => {
    const authenticatedUser = requestContext.get('user');
    if (!authenticatedUser) {
        throw new Error('User not found in context');
    }
    return authenticatedUser;
};
/**
 * Handle the GET request to fetch calendar connections
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with calendar connections or error message
 */
export async function handleGetCalendarConnections(requestContext: Context) {
    try {
        const authenticatedUser = getUser(requestContext);
        const userCalendarConnections = await db
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
                    eq(calendarConnections.userId, authenticatedUser.id),
                    eq(calendarConnections.isActive, true),
                ),
            )
            .orderBy(calendarConnections.isPrimary, calendarConnections.createdAt);

        return requestContext.json(userCalendarConnections);
    } catch (fetchCalendarConnectionsError) {
        console.error('Error fetching calendar connections:', fetchCalendarConnectionsError);
        return requestContext.json({ error: 'Failed to fetch calendar connections' }, 500);
    }
}

/**
 * Handle the GET request to fetch calendar accounts
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with calendar accounts and their calendars or error message
 */
export async function handleGetCalendarAccounts(requestContext: Context) {
    try {
        const authenticatedUser = getUser(requestContext);
        // Get all Google accounts for the user with their calendars
        const userGoogleAccounts = await db
            .select({
                accountId: account.id,
                googleAccountId: account.accountId,
                scope: account.scope,
                createdAt: account.createdAt,
            })
            .from(account)
            .where(and(eq(account.userId, authenticatedUser.id), eq(account.providerId, 'google')));

        // Get calendar counts for each account
        const googleAccountsWithCalendars = await Promise.all(
            userGoogleAccounts.map(async (googleAccountData) => {
                const accountCalendars = await db
                    .select()
                    .from(calendarConnections)
                    .where(
                        and(
                            eq(calendarConnections.accountId, googleAccountData.accountId),
                            eq(calendarConnections.isActive, true),
                        ),
                    );

                // Get email from first calendar connection if available
                const accountEmail =
                    accountCalendars.length > 0
                        ? accountCalendars[0].googleEmail
                        : googleAccountData.googleAccountId;

                return {
                    accountId: googleAccountData.accountId,
                    googleAccountId: googleAccountData.googleAccountId,
                    email: accountEmail,
                    calendarCount: accountCalendars.length,
                    calendars: accountCalendars.map((calendarConnection) => ({
                        id: calendarConnection.id,
                        calendarId: calendarConnection.calendarId,
                        name: calendarConnection.calendarName,
                        isPrimary: calendarConnection.isPrimary,
                        includeInAvailability: calendarConnection.includeInAvailability,
                        syncStatus: calendarConnection.syncStatus,
                    })),
                };
            }),
        );

        return requestContext.json(googleAccountsWithCalendars);
    } catch (fetchCalendarAccountsError) {
        console.error('Error fetching Google accounts:', fetchCalendarAccountsError);
        return requestContext.json({ error: 'Failed to fetch Google accounts' }, 500);
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
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response confirming update or error message
 */
export async function handleUpdateCalendarConnection(requestContext: Context) {
    try {
        const targetConnectionId = requestContext.req.param('id');
        const authenticatedUser = getUser(requestContext);
        const connectionUpdatePayload = await requestContext.req.json();

        // Validate that the connection belongs to the user
        const existingConnection = await db
            .select()
            .from(calendarConnections)
            .where(
                and(
                    eq(calendarConnections.id, targetConnectionId),
                    eq(calendarConnections.userId, authenticatedUser.id),
                    eq(calendarConnections.isActive, true),
                ),
            )
            .limit(1);

        if (existingConnection.length === 0) {
            return requestContext.json({ error: 'Connection not found' }, 404);
        }

        // If setting as primary, unset other primary calendars first
        if (connectionUpdatePayload.isPrimary === true) {
            await db
                .update(calendarConnections)
                .set({ isPrimary: false, updatedAt: new Date() })
                .where(
                    and(
                        eq(calendarConnections.userId, authenticatedUser.id),
                        eq(calendarConnections.isActive, true),
                    ),
                );
        }

        // Update the connection
        await db
            .update(calendarConnections)
            .set({
                ...connectionUpdatePayload,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(calendarConnections.id, targetConnectionId),
                    eq(calendarConnections.isActive, true),
                ),
            );

        // If setting as primary, update preferences to reference this account
        if (connectionUpdatePayload.isPrimary === true) {
            try {
                const updatedCalendarConnection = await db
                    .select({ accountId: calendarConnections.accountId })
                    .from(calendarConnections)
                    .where(eq(calendarConnections.id, targetConnectionId))
                    .limit(1);

                if (updatedCalendarConnection.length > 0) {
                    await updatePrimaryAccount(
                        authenticatedUser.id,
                        updatedCalendarConnection[0].accountId,
                    );
                }
            } catch (updatePrimaryAccountError) {
                console.error(
                    'Error updating preferences primary account:',
                    updatePrimaryAccountError,
                );
                // Don't fail the request if preferences update fails
            }
        }

        return requestContext.json({ success: true });
    } catch (updateCalendarConnectionError) {
        console.error('Error updating calendar connection:', updateCalendarConnectionError);
        return requestContext.json({ error: 'Failed to update calendar connection' }, 500);
    }
}

/**
 * Handle the DELETE request to delete a calendar account and all its connections
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response confirming deletion or error message
 */
export async function handleDeleteCalendarAccount(requestContext: Context) {
    try {
        const authenticatedUser = getUser(requestContext);
        const deleteAccountPayload = await requestContext.req.json();
        const { accountId: targetAccountId } = deleteAccountPayload;

        if (!targetAccountId) {
            return requestContext.json({ error: 'accountId is required' }, 400);
        }

        // Validate that the account belongs to the user
        const targetAccountData = await db
            .select()
            .from(account)
            .where(and(eq(account.id, targetAccountId), eq(account.userId, authenticatedUser.id)))
            .limit(1);

        if (targetAccountData.length === 0) {
            return requestContext.json({ error: 'Account not found' }, 404);
        }

        // Check if this is the only account - prevent deletion if so
        const userGoogleAccountsCount = await db
            .select()
            .from(account)
            .where(and(eq(account.userId, authenticatedUser.id), eq(account.providerId, 'google')));

        if (userGoogleAccountsCount.length === 1) {
            return requestContext.json(
                {
                    error: 'Cannot delete the only calendar account. You must have at least one calendar account connected.',
                },
                400,
            );
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
                    eq(calendarConnections.accountId, targetAccountId),
                    eq(calendarConnections.isActive, true),
                ),
            );

        // Delete the account
        await db.delete(account).where(eq(account.id, targetAccountId));

        return requestContext.json({ success: true });
    } catch (deleteCalendarAccountError) {
        console.error('Error deleting calendar account:', deleteCalendarAccountError);
        return requestContext.json({ error: 'Failed to delete calendar account' }, 500);
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
        const { startTime, endTime, timeDurationMinutes, responseTimezone } = await c.req.json();

        if (!startTime || !endTime) {
            return c.json({ error: 'startTime and endTime are required' }, 400);
        }

        // Use calendar service to check availability
        const calendarService = createCalendarService(user.id);

        const availabilityResult = await calendarService.checkAvailability(startTime, endTime, {
            timeDurationMinutes: timeDurationMinutes,
            responseTimezone: responseTimezone,
        });

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
            availabilityResult: availabilityResult,
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
