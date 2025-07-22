import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { google, calendar_v3 } from 'googleapis';
import { GoogleAuthManager } from './manager';

/**
 * GoogleAccount is the response from the calendar API when getting Google accounts.
 */
interface GoogleAccount {
    id: string;
    accountId: string;
    providerId: string;
    accessToken?: string | null;
    userId: string;
}

/**
 * UserProfile is the response from the calendar API when getting user profile.
 */
interface UserProfile {
    email: string;
    name: string;
}

/**
 * Calendar data structure from Google Calendar API
 */
interface GoogleCalendar {
    id: string;
    summary: string;
    timeZone?: string;
    primary?: boolean;
}

/**
 * ConnectionManager handles Google calendar connections and synchronization.
 * @param userId - The user id from the Better Auth user.
 * @param accountId - The account id from the Better Auth account.
 * @param googleAccountId - The Google account id from the Better Auth account.
 * @param googleEmail - The Google email from the Better Auth account.
 */
export class ConnectionManager {
    private userId: string;
    private accountId: string;
    private googleAccountId: string;
    private googleEmail: string;
    private authManager: GoogleAuthManager;
    private calendarCache: Map<string, calendar_v3.Calendar> = new Map();

    constructor({
        userId,
        accountId,
        googleAccountId,
        googleEmail,
    }: {
        userId: string;
        accountId: string;
        googleAccountId: string;
        googleEmail: string;
    }) {
        this.userId = userId;
        this.accountId = accountId;
        this.googleAccountId = googleAccountId;
        this.googleEmail = googleEmail;
        this.authManager = new GoogleAuthManager();
    }

    /**
     * Handles the Google calendar connection for a user.
     * @param userId - The user id from the Better Auth user.
     * @param account - The account from the Better Auth account.
     * @param profile - The profile from the Better Auth profile.
     */
    static async handleGoogleCalendarConnection({
        userId,
        account,
        profile,
    }: {
        userId: string;
        account: GoogleAccount;
        profile: UserProfile;
    }): Promise<void> {
        try {
            if (!account.accessToken) {
                return;
            }

            if (!account.accountId) {
                return;
            }

            const connectionManager = new ConnectionManager({
                userId,
                accountId: account.id,
                googleAccountId: account.accountId,
                googleEmail: profile.email,
            });

            // Fetch and store available calendars
            await connectionManager.syncUserCalendars();
        } catch (error) {
            // Error handling
        }
    }

    /**
     * Get calendar API instance for a specific account
     */
    private async getCalendarApi(): Promise<calendar_v3.Calendar> {
        // Check cache first
        if (this.calendarCache.has(this.accountId)) {
            return this.calendarCache.get(this.accountId)!;
        }

        const authClient = await this.authManager.getAuthenticatedClient(this.accountId);
        const calendar = google.calendar({ version: 'v3', auth: authClient });

        // Cache the instance
        this.calendarCache.set(this.accountId, calendar);

        return calendar;
    }

    /**
     * Syncs the user's calendars from Google Calendar API.
     */
    async syncUserCalendars(): Promise<void> {
        try {
            const calendar = await this.getCalendarApi();

            const calendars = await this.fetchCalendarsFromGoogle(calendar);

            if (!calendars) {
                return;
            }

            await this.storeCalendars(calendars);
        } catch (error) {
            // Error handling
        }
    }

    /**
     * Fetches calendars from Google Calendar API using the SDK.
     */
    private async fetchCalendarsFromGoogle(
        calendar: calendar_v3.Calendar,
    ): Promise<GoogleCalendar[] | null> {
        try {
            const response = await calendar.calendarList.list();

            if (response.status !== 200) {
                return null;
            }

            const calendars = response.data.items || [];
            return calendars.map((cal) => ({
                id: cal.id!,
                summary: cal.summary!,
                timeZone: cal.timeZone || undefined,
                primary: cal.primary || false,
            }));
        } catch (error) {
            return null;
        }
    }

    /**
     * Stores calendars in the database.
     */
    private async storeCalendars(calendars: GoogleCalendar[]): Promise<void> {
        for (const calendar of calendars) {
            await db
                .insert(calendarConnections)
                .values({
                    id: crypto.randomUUID(),
                    userId: this.userId,
                    accountId: this.accountId,
                    googleAccountId: this.googleAccountId,
                    googleEmail: this.googleEmail,
                    calendarId: calendar.id,
                    calendarName: calendar.summary,
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
                        calendarName: calendar.summary,
                        calendarTimeZone: calendar.timeZone,
                        lastSyncAt: new Date(),
                        syncStatus: 'active',
                        updatedAt: new Date(),
                    },
                });
        }
    }

    /**
     * Gets the current connection details.
     */
    getConnectionDetails() {
        return {
            userId: this.userId,
            accountId: this.accountId,
            googleAccountId: this.googleAccountId,
            googleEmail: this.googleEmail,
        };
    }
}
