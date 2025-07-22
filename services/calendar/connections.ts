import { calendar_v3 } from 'googleapis';
import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { user } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';
import { BaseCalendarService, CalendarInfo } from './base';
import { SyncAllCalendarsResult, FetchAllCalendarListsResult } from '@/types/services';

export class CalendarConnectionsService extends BaseCalendarService {
    /**
     * List all calendars for the user
     */
    async listCalendars(): Promise<CalendarInfo[]> {
        console.log('┌─ [CALENDAR_CONNECTIONS] Listing calendars for user...', {
            userId: this.userId,
        });
        try {
            console.log('├─ [CALENDAR_CONNECTIONS] Getting active connections...');
            const connections = await this.getActiveConnections();
            console.log('├─ [CALENDAR_CONNECTIONS] Found connections:', {
                count: connections.length,
            });
            const calendars: CalendarInfo[] = [];

            for (const { connection, account } of connections) {
                if (!account) continue;

                try {
                    const calendar = await this.getCalendarApi(account.id);

                    // Use calendarList.get to get full calendar info including colors and access role
                    let calendarData: calendar_v3.Schema$CalendarListEntry;
                    try {
                        const listResponse = await calendar.calendarList.get({
                            calendarId: connection.calendarId,
                        });
                        calendarData = listResponse.data;
                    } catch {
                        // Fallback to calendars.get if calendarList fails
                        const calResponse = await calendar.calendars.get({
                            calendarId: connection.calendarId,
                        });
                        // Convert Schema$Calendar to Schema$CalendarListEntry format
                        calendarData = {
                            id: calResponse.data.id,
                            summary: calResponse.data.summary,
                            description: calResponse.data.description,
                            timeZone: calResponse.data.timeZone,
                            primary: false, // calendars.get doesn't return primary status
                            accessRole: 'owner', // Default for calendars.get
                            backgroundColor: '#4285f4', // Default Google Calendar color
                            foregroundColor: '#ffffff', // Default text color
                        };
                    }

                    calendars.push({
                        id: connection.calendarId,
                        summary:
                            connection.calendarName || calendarData.summary || 'Unknown Calendar',
                        description: calendarData.description || undefined,
                        primary: connection.isPrimary || false,
                        accessRole: calendarData.accessRole || undefined,
                        backgroundColor: calendarData.backgroundColor || undefined,
                        foregroundColor: calendarData.foregroundColor || undefined,
                        timeZone: connection.calendarTimeZone || calendarData.timeZone || undefined,
                        syncStatus:
                            (connection.syncStatus as 'active' | 'error' | 'paused') || 'active',
                        lastSyncAt: connection.lastSyncAt?.toISOString(),
                        googleEmail: connection.googleEmail,
                    });
                } catch (error) {
                    console.error(
                        '├─ [CALENDAR_CONNECTIONS] Error fetching calendar info:',
                        connection.calendarId,
                        error,
                    );
                    // Add calendar with error status
                    calendars.push({
                        id: connection.calendarId,
                        summary: connection.calendarName || 'Unknown Calendar',
                        description: undefined,
                        primary: connection.isPrimary || false,
                        accessRole: undefined,
                        backgroundColor: undefined,
                        foregroundColor: undefined,
                        timeZone: connection.calendarTimeZone || undefined,
                        syncStatus: 'error',
                        lastSyncAt: connection.lastSyncAt?.toISOString(),
                        googleEmail: connection.googleEmail,
                    });
                }
            }

            console.log('└─ [CALENDAR_CONNECTIONS] Returning calendars:', {
                count: calendars.length,
            });
            return calendars;
        } catch (error) {
            console.error('└─ [CALENDAR_CONNECTIONS] Error listing calendars:', error);
            throw new Error(
                `Failed to list calendars: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Sync all calendars for the user
     */
    async syncAllCalendars(): Promise<SyncAllCalendarsResult> {
        console.log('┌─ [CALENDAR_CONNECTIONS] Starting calendar sync...', { userId: this.userId });

        const results: SyncAllCalendarsResult = { success: 0, errors: [] };

        try {
            const connections = await this.getActiveConnections();

            for (const { connection, account } of connections) {
                if (!account) {
                    results.errors.push(`No account found for connection ${connection.id}`);
                    continue;
                }

                try {
                    // Update last sync time
                    await db
                        .update(calendarConnections)
                        .set({
                            lastSyncAt: new Date(),
                            syncStatus: 'active',
                        })
                        .where(eq(calendarConnections.id, connection.id));

                    results.success++;
                    console.log(
                        '├─ [CALENDAR_CONNECTIONS] Synced calendar:',
                        connection.calendarId,
                    );
                } catch (error) {
                    const errorMsg = `Failed to sync calendar ${connection.calendarId}: ${
                        error instanceof Error ? error.message : 'Unknown error'
                    }`;
                    results.errors.push(errorMsg);
                    console.error('├─ [CALENDAR_CONNECTIONS] Sync error:', errorMsg);

                    // Update sync status to error
                    try {
                        await db
                            .update(calendarConnections)
                            .set({
                                syncStatus: 'error',
                                lastSyncAt: new Date(),
                            })
                            .where(eq(calendarConnections.id, connection.id));
                    } catch (updateError) {
                        console.error(
                            '├─ [CALENDAR_CONNECTIONS] Failed to update error status:',
                            updateError,
                        );
                    }
                }
            }

            console.log('└─ [CALENDAR_CONNECTIONS] Sync completed:', results);
            return results;
        } catch (error) {
            console.error('└─ [CALENDAR_CONNECTIONS] Sync failed:', error);
            throw new Error(
                `Failed to sync calendars: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Fetch all calendar lists from Google and store them
     */
    async fetchAllCalendarLists(): Promise<FetchAllCalendarListsResult> {
        console.log('┌─ [CALENDAR_CONNECTIONS] Fetching all calendar lists...', {
            userId: this.userId,
        });

        const results: FetchAllCalendarListsResult = {
            accountsSynced: 0,
            calendarsSynced: 0,
            errors: [],
        };

        try {
            const connections = await this.getActiveConnections();
            const uniqueAccounts = new Map();

            // Group by account
            for (const { account } of connections) {
                if (!account) continue;
                if (!uniqueAccounts.has(account.id)) {
                    uniqueAccounts.set(account.id, account);
                }
            }

            // Get user's email
            const [userRecord] = await db
                .select({ email: user.email })
                .from(user)
                .where(eq(user.id, this.userId))
                .limit(1);

            if (!userRecord) {
                results.errors.push('User not found');
                return results;
            }

            // Process each unique account
            for (const accountData of Array.from(uniqueAccounts.values())) {
                try {
                    const calendar = await this.getCalendarApi(accountData.id);

                    // Fetch calendars from Google using calendarList.list
                    const response = await calendar.calendarList.list();

                    if (response.status !== 200) {
                        results.errors.push(
                            `Failed to fetch calendars for account ${accountData.id}: ${response.statusText}`,
                        );
                        continue;
                    }

                    const calendars = response.data.items || [];

                    // Store each calendar
                    for (const calendarInfo of calendars) {
                        await db
                            .insert(calendarConnections)
                            .values({
                                id: crypto.randomUUID(),
                                userId: this.userId,
                                accountId: accountData.id,
                                googleAccountId: accountData.accountId,
                                googleEmail: userRecord.email, // Use the user's email from the database
                                calendarId: calendarInfo.id!,
                                calendarName: calendarInfo.summary!,
                                calendarTimeZone: calendarInfo.timeZone,
                                isPrimary: calendarInfo.primary || false,
                                includeInAvailability: true,
                                lastSyncAt: new Date(),
                                syncStatus: 'active',
                            })
                            .onConflictDoUpdate({
                                target: [
                                    calendarConnections.userId,
                                    calendarConnections.googleAccountId,
                                    calendarConnections.calendarId,
                                ],
                                set: {
                                    calendarName: calendarInfo.summary!,
                                    calendarTimeZone: calendarInfo.timeZone,
                                    lastSyncAt: new Date(),
                                    syncStatus: 'active',
                                },
                            });

                        results.calendarsSynced++;
                    }

                    results.accountsSynced++;
                    console.log('├─ [CALENDAR_CONNECTIONS] Synced account:', accountData.id);
                } catch (error) {
                    const errorMsg = `Failed to process account ${accountData.id}: ${
                        error instanceof Error ? error.message : 'Unknown error'
                    }`;
                    results.errors.push(errorMsg);
                    console.error('├─ [CALENDAR_CONNECTIONS] Account sync error:', errorMsg);
                }
            }

            console.log('└─ [CALENDAR_CONNECTIONS] Fetch completed:', results);
            return results;
        } catch (error) {
            console.error('└─ [CALENDAR_CONNECTIONS] Fetch failed:', error);
            throw new Error(
                `Failed to fetch calendar lists: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}
