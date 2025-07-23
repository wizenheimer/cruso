import { GoogleAuthManager } from './auth';
import { calendar_v3 } from 'googleapis';
import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { account } from '@/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { google } from 'googleapis';

export abstract class BaseCalendarService {
    protected userId: string;
    protected authManager: GoogleAuthManager;
    protected calendarCache: Map<string, calendar_v3.Calendar> = new Map();

    constructor(userId: string) {
        this.userId = userId;
        this.authManager = new GoogleAuthManager();
    }

    /**
     * Get calendar API instance for a specific account
     */
    protected async getCalendarApi(accountId: string): Promise<calendar_v3.Calendar> {
        // Check cache first
        if (this.calendarCache.has(accountId)) {
            return this.calendarCache.get(accountId)!;
        }

        const authClient = await this.authManager.getAuthenticatedClient(accountId);
        const calendar = google.calendar({ version: 'v3', auth: authClient });

        // Cache the instance
        this.calendarCache.set(accountId, calendar);

        return calendar;
    }

    /**
     * Get active calendar connections for the user
     */
    protected async getActiveConnections() {
        const connections = await db
            .select({
                connection: calendarConnections,
                account: account,
            })
            .from(calendarConnections)
            .leftJoin(account, eq(calendarConnections.accountId, account.id))
            .where(
                and(
                    eq(calendarConnections.userId, this.userId),
                    eq(calendarConnections.isActive, true),
                ),
            );

        return connections;
    }

    /**
     * Get calendar connection data for a specific calendar
     */
    protected async getCalendarConnection(calendarId: string) {
        const connection = await db
            .select({
                connection: calendarConnections,
                account: account,
            })
            .from(calendarConnections)
            .leftJoin(account, eq(calendarConnections.accountId, account.id))
            .where(
                and(
                    eq(calendarConnections.calendarId, calendarId),
                    eq(calendarConnections.userId, this.userId),
                    eq(calendarConnections.isActive, true),
                ),
            )
            .limit(1);

        if (connection.length === 0) {
            throw new Error(`Calendar connection not found for calendar ID: ${calendarId}`);
        }

        return connection[0];
    }

    /**
     * Get primary calendar ID for the user
     */
    protected async getPrimaryCalendarId(): Promise<string> {
        const primaryConnection = await db
            .select()
            .from(calendarConnections)
            .where(
                and(
                    eq(calendarConnections.userId, this.userId),
                    eq(calendarConnections.isActive, true),
                    eq(calendarConnections.isPrimary, true),
                ),
            )
            .limit(1);

        if (primaryConnection.length === 0) {
            throw new Error('No primary calendar found for user');
        }

        return primaryConnection[0].calendarId;
    }
}
