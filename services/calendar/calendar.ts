import {
    GoogleCalendarListEntry,
    GoogleCalendarListOptions,
    GoogleCalendarListResponse,
} from '@/types/google-calendar/list-calendar';
import { BaseCalendarService } from './base';
import { CalendarRefreshResult } from '@/types/calendar';
import { Account } from 'better-auth';
import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { user } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';

export class GoogleCalendarService extends BaseCalendarService {
    /*
     * Refresh calendars for a user from all active accounts
     */
    async refreshCalendars(
        listOptions?: GoogleCalendarListOptions,
    ): Promise<CalendarRefreshResult> {
        // Prepare a default list option overriden by the caller
        const defaultListOptions: GoogleCalendarListOptions = {
            maxResults: 100,
            showHidden: true,
            showDeleted: false,
        };
        const finalListOptions = { ...defaultListOptions, ...listOptions };

        // Get all active connections
        const connections = await this.getActiveConnections();
        const uniqueAccounts = new Map<string, Account>();

        // Group connections by account
        for (const { account } of connections) {
            if (!account) continue;
            if (!uniqueAccounts.has(account.id)) {
                uniqueAccounts.set(account.id, account);
            }
        }

        const refreshResults: CalendarRefreshResult = {
            accountsSynced: 0,
            calendarsSynced: 0,
            errors: [],
        };

        // Get user details
        let userEmail: string;
        try {
            const { email } = await this.getUserEmail();
            userEmail = email;
        } catch (error) {
            refreshResults.errors.push(`Failed to get user email: ${error}`);
            return refreshResults;
        }

        for (const account of uniqueAccounts.values()) {
            // List the calendars
            const calendars = await this.listCalendars(account, finalListOptions);

            // Store the calendars
            const storedCalendars = await this.storeCalendars(account, calendars, userEmail);

            // Update the refresh results
            refreshResults.accountsSynced++;
            refreshResults.calendarsSynced += storedCalendars;
        }

        return refreshResults;
    }

    /*
     * List calendars for a user from a specific account
     */
    private async listCalendars(
        account: Account,
        listOptions: GoogleCalendarListOptions,
    ): Promise<GoogleCalendarListEntry[]> {
        const calendar = await this.getCalendarApi(account.id);
        const listResponse = await calendar.calendarList.list(listOptions);

        if (listResponse.status !== 200) {
            throw new Error(`Failed to list calendars for account: ${account.id}`);
        }

        const listResponseData = listResponse.data as GoogleCalendarListResponse;
        const calendars = listResponseData.items;

        if (!calendars) {
            throw new Error(`No calendars found for account: ${account.id}`);
        }

        return calendars;
    }

    /*
     * Store calendars for a user from a specific account
     */
    private async storeCalendars(
        account: Account,
        calendars: GoogleCalendarListEntry[],
        userEmail: string,
    ): Promise<number> {
        let storedCalendars = 0;

        for (const calendar of calendars) {
            await db
                .insert(calendarConnections)
                .values({
                    id: crypto.randomUUID(),
                    userId: this.userId,
                    accountId: account.id,
                    googleAccountId: account.accountId,
                    googleEmail: userEmail,
                    calendarId: calendar.id!,
                    calendarName: calendar.summary!,
                    calendarTimeZone: calendar.timeZone,
                    isPrimary: calendar.primary || false,
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
                        calendarName: calendar.summary!,
                        calendarTimeZone: calendar.timeZone,
                        lastSyncAt: new Date(),
                        syncStatus: 'active',
                    },
                });

            storedCalendars++;
        }

        return storedCalendars;
    }

    /*
     * Get user details
     */
    private async getUserEmail(): Promise<{ email: string }> {
        const [userRecord] = await db
            .select({ email: user.email })
            .from(user)
            .where(eq(user.id, this.userId))
            .limit(1);

        if (!userRecord) {
            throw new Error('User not found');
        }

        return userRecord;
    }
}
