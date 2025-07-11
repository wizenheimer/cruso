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
            console.log('\n [CONNECTION] Handling Google calendar connection for user:', userId);
            console.log(' [CONNECTION] Account details:', {
                id: account.id,
                accountId: account.accountId,
                providerId: account.providerId,
                hasAccessToken: !!account.accessToken,
            });
            console.log(' [CONNECTION] Profile details:', {
                email: profile.email,
                name: profile.name,
            });

            if (!account.accessToken) {
                console.error(' [CONNECTION] No access token available for calendar sync');
                return;
            }

            if (!account.accountId) {
                console.error(' [CONNECTION] No Google account ID available for calendar sync');
                return;
            }

            console.log(' [CONNECTION] Creating ConnectionManager instance...');
            const connectionManager = new ConnectionManager({
                userId,
                accountId: account.id,
                googleAccountId: account.accountId,
                googleEmail: profile.email,
            });

            console.log(' [CONNECTION] ConnectionManager created with:', {
                userId,
                accountId: account.id,
                googleAccountId: account.accountId,
                googleEmail: profile.email,
            });

            // Fetch and store available calendars
            console.log(' [CONNECTION] Starting calendar sync...');
            await connectionManager.syncUserCalendars();

            console.log(' [CONNECTION] handleGoogleCalendarConnection completed successfully');
        } catch (error) {
            console.error(' [CONNECTION] Error handling Google calendar connection:', error);
            console.error(' [CONNECTION] Full error details:', error);
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
            console.log('\n [SYNC] Syncing calendars for user:', {
                userId: this.userId,
                accountId: this.accountId,
                googleAccountId: this.googleAccountId,
                googleEmail: this.googleEmail,
            });

            console.log(' [SYNC] Getting calendar API instance...');
            const calendar = await this.getCalendarApi();

            console.log(' [SYNC] Fetching calendars from Google...');
            const calendars = await this.fetchCalendarsFromGoogle(calendar);

            if (!calendars) {
                console.error(' [SYNC] Failed to fetch calendars from Google');
                return;
            }

            console.log(
                ` [SYNC] Found ${calendars.length} calendars for user ${this.userId}:`,
                calendars.map((c: GoogleCalendar) => ({
                    id: c.id,
                    name: c.summary,
                    primary: c.primary,
                })),
            );

            console.log(' [SYNC] Storing calendars in database...');
            await this.storeCalendars(calendars);

            console.log(
                ` [SYNC] Finished syncing ${calendars.length} calendars for user ${this.userId}`,
            );
        } catch (error) {
            console.error(' [SYNC] Error syncing calendars:', error);
            console.error(' [SYNC] Error details:', error);
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

            console.log('Google Calendar API response status:', response.status);

            if (response.status !== 200) {
                console.error('Failed to fetch calendars:', response.statusText);
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
            console.error('Error fetching calendars from Google:', error);
            return null;
        }
    }

    /**
     * Stores calendars in the database.
     */
    private async storeCalendars(calendars: GoogleCalendar[]): Promise<void> {
        for (const calendar of calendars) {
            console.log(` [STORE] Inserting calendar: ${calendar.summary} (${calendar.id})`);
            console.log(` [STORE] Calendar data:`, {
                calendarId: calendar.id,
                calendarName: calendar.summary,
                timeZone: calendar.timeZone,
                isPrimary: calendar.primary,
                googleAccountId: this.googleAccountId,
                googleEmail: this.googleEmail,
            });

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

            console.log(` [STORE] Successfully stored calendar: ${calendar.summary}`);
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
