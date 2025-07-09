import { google, calendar_v3 } from 'googleapis';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { account } from '@/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { GoogleAuthManager } from './manager';

export interface CalendarEvent {
    id?: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    attendees?: Array<{
        email: string;
        displayName?: string;
        responseStatus?: string;
    }>;
    location?: string;
    conferenceData?: calendar_v3.Schema$ConferenceData;
    reminders?: {
        useDefault?: boolean;
        overrides?: Array<{
            method: string;
            minutes: number;
        }>;
    };
}

export interface CalendarEvent {
    id?: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    attendees?: Array<{
        email: string;
        displayName?: string;
        responseStatus?: string;
    }>;
    location?: string;
    conferenceData?: calendar_v3.Schema$ConferenceData;
    reminders?: {
        useDefault?: boolean;
        overrides?: Array<{
            method: string;
            minutes: number;
        }>;
    };
}

export interface CalendarInfo {
    id: string;
    summary: string;
    description?: string;
    primary?: boolean;
    accessRole?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    timeZone?: string;
    syncStatus: 'active' | 'error' | 'paused';
    lastSyncAt?: string;
    googleEmail: string;
}

export interface AvailabilityResult {
    isAvailable: boolean;
    busySlots: Array<{ start: string; end: string }>;
    events: Array<{
        id: string;
        summary: string;
        start: string;
        end: string;
        calendarId: string;
        calendarName: string;
    }>;
}

export class GoogleCalendarService {
    private userId: string;
    private authManager: GoogleAuthManager;
    private calendarCache: Map<string, calendar_v3.Calendar> = new Map();

    constructor(userId: string) {
        this.userId = userId;
        this.authManager = new GoogleAuthManager();
    }

    /**
     * Get calendar API instance for a specific account
     */
    private async getCalendarApi(accountId: string): Promise<calendar_v3.Calendar> {
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
    private async getActiveConnections() {
        return await db
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
    }

    /**
     * Get a specific calendar connection with its account
     */
    private async getCalendarConnection(calendarId: string) {
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
                    eq(calendarConnections.calendarId, calendarId),
                    eq(calendarConnections.isActive, true),
                ),
            )
            .limit(1);

        if (connections.length === 0) {
            throw new Error(`No active connection found for calendar ${calendarId}`);
        }

        return connections[0];
    }

    /**
     * List all calendars for the user
     */
    async listCalendars(): Promise<CalendarInfo[]> {
        try {
            const connections = await this.getActiveConnections();
            const calendars: CalendarInfo[] = [];

            for (const { connection, account } of connections) {
                if (!account) continue;

                try {
                    const calendar = await this.getCalendarApi(account.id);

                    // Use calendarList.get to get full calendar info including colors and access role
                    let calendarData;
                    try {
                        const listResponse = await calendar.calendarList.get({
                            calendarId: connection.calendarId,
                        });
                        calendarData = listResponse.data;
                    } catch (error) {
                        // Fallback to calendars.get if calendarList fails
                        const calResponse = await calendar.calendars.get({
                            calendarId: connection.calendarId,
                        });
                        calendarData = calResponse.data;
                    }

                    calendars.push({
                        id: calendarData.id!,
                        summary: calendarData.summary!,
                        description: calendarData.description || undefined,
                        primary:
                            'primary' in calendarData
                                ? (calendarData.primary as boolean)
                                : (connection.isPrimary ?? undefined),
                        accessRole:
                            'accessRole' in calendarData
                                ? (calendarData.accessRole as string)
                                : undefined,
                        backgroundColor:
                            'backgroundColor' in calendarData
                                ? (calendarData.backgroundColor as string)
                                : undefined,
                        foregroundColor:
                            'foregroundColor' in calendarData
                                ? (calendarData.foregroundColor as string)
                                : undefined,
                        timeZone: calendarData.timeZone || undefined,
                        syncStatus: connection.syncStatus as 'active' | 'error' | 'paused',
                        lastSyncAt: connection.lastSyncAt?.toISOString(),
                        googleEmail: connection.googleEmail,
                    });

                    // Update sync status on success
                    await db
                        .update(calendarConnections)
                        .set({
                            syncStatus: 'active',
                            lastSyncAt: new Date(),
                            errorMessage: null,
                            updatedAt: new Date(),
                        })
                        .where(eq(calendarConnections.id, connection.id));
                } catch (error) {
                    console.error(`Error fetching calendar ${connection.calendarId}:`, error);

                    // Mark calendar as having issues
                    await db
                        .update(calendarConnections)
                        .set({
                            syncStatus: 'error',
                            errorMessage: error instanceof Error ? error.message : 'Unknown error',
                            updatedAt: new Date(),
                        })
                        .where(eq(calendarConnections.id, connection.id));
                }
            }

            return calendars;
        } catch (error) {
            throw new Error(
                `Failed to list calendars: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get events from a specific calendar
     */
    async getEvents(
        calendarId: string,
        timeMin: string,
        timeMax: string,
        options?: {
            maxResults?: number;
            pageToken?: string;
            q?: string;
            showDeleted?: boolean;
            singleEvents?: boolean;
            orderBy?: 'startTime' | 'updated';
        },
    ): Promise<{ events: CalendarEvent[]; nextPageToken?: string }> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const response = await calendar.events.list({
                calendarId,
                timeMin,
                timeMax,
                maxResults: options?.maxResults || 250,
                pageToken: options?.pageToken,
                q: options?.q,
                showDeleted: options?.showDeleted ?? false,
                singleEvents: options?.singleEvents ?? true,
                orderBy: options?.orderBy || 'startTime',
            });

            const events = (response.data.items || []).map(this.transformGoogleEvent);

            return {
                events,
                nextPageToken: response.data.nextPageToken || undefined,
            };
        } catch (error) {
            throw new Error(
                `Failed to get events: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Create an event in a specific calendar
     */
    async createEvent(
        calendarId: string,
        event: CalendarEvent,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
            conferenceDataVersion?: number;
        },
    ): Promise<CalendarEvent> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const response = await calendar.events.insert({
                calendarId,
                requestBody: event as calendar_v3.Schema$Event,
                sendUpdates: options?.sendUpdates || 'none',
                conferenceDataVersion: options?.conferenceDataVersion,
            });

            return this.transformGoogleEvent(response.data);
        } catch (error) {
            throw new Error(
                `Failed to create event: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Update an event in a specific calendar
     */
    async updateEvent(
        calendarId: string,
        eventId: string,
        event: Partial<CalendarEvent>,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            // First get the existing event
            const existingEvent = await calendar.events.get({
                calendarId,
                eventId,
            });

            // Merge with updates
            const updatedEvent = {
                ...existingEvent.data,
                ...event,
            };

            const response = await calendar.events.update({
                calendarId,
                eventId,
                requestBody: updatedEvent as calendar_v3.Schema$Event,
                sendUpdates: options?.sendUpdates || 'none',
            });

            return this.transformGoogleEvent(response.data);
        } catch (error) {
            throw new Error(
                `Failed to update event: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Delete an event from a specific calendar
     */
    async deleteEvent(
        calendarId: string,
        eventId: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<void> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            await calendar.events.delete({
                calendarId,
                eventId,
                sendUpdates: options?.sendUpdates || 'none',
            });
        } catch (error) {
            throw new Error(
                `Failed to delete event: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Check availability across all user's calendars
     */
    async checkAvailability(
        timeMin: string,
        timeMax: string,
        options: {
            includeCalendarIds?: string[];
            excludeCalendarIds?: string[];
            timeZone?: string;
        } = {},
    ): Promise<AvailabilityResult> {
        try {
            let connections = await db
                .select({
                    connection: calendarConnections,
                    account: account,
                })
                .from(calendarConnections)
                .leftJoin(account, eq(calendarConnections.accountId, account.id))
                .where(
                    and(
                        eq(calendarConnections.userId, this.userId),
                        eq(calendarConnections.includeInAvailability, true),
                        eq(calendarConnections.isActive, true),
                    ),
                );

            // Apply filters if provided
            if (options.includeCalendarIds?.length) {
                connections = connections.filter(({ connection }) =>
                    options.includeCalendarIds!.includes(connection.calendarId),
                );
            }

            if (options.excludeCalendarIds?.length) {
                connections = connections.filter(
                    ({ connection }) =>
                        !options.excludeCalendarIds!.includes(connection.calendarId),
                );
            }

            const allEvents: AvailabilityResult['events'] = [];
            const busySlots: Array<{ start: string; end: string }> = [];

            // Group connections by account for efficient API calls
            const connectionsByAccount = new Map<string, typeof connections>();
            for (const conn of connections) {
                if (!conn.account) continue;

                const accountId = conn.account.id;
                if (!connectionsByAccount.has(accountId)) {
                    connectionsByAccount.set(accountId, []);
                }
                connectionsByAccount.get(accountId)!.push(conn);
            }

            // Check availability for each account
            for (const [accountId, accountConnections] of connectionsByAccount) {
                try {
                    const calendar = await this.getCalendarApi(accountId);

                    // Use freebusy API for efficient availability checking
                    const freebusyResponse = await calendar.freebusy.query({
                        requestBody: {
                            timeMin,
                            timeMax,
                            timeZone: options.timeZone,
                            items: accountConnections.map(({ connection }) => ({
                                id: connection.calendarId,
                            })),
                        },
                    });

                    // Process freebusy results
                    for (const { connection } of accountConnections) {
                        const calendarBusy =
                            freebusyResponse.data.calendars?.[connection.calendarId]?.busy || [];

                        busySlots.push(
                            ...calendarBusy.map((slot) => ({
                                start: slot.start!,
                                end: slot.end!,
                            })),
                        );

                        // Also get detailed events for context
                        try {
                            const { events } = await this.getEvents(
                                connection.calendarId,
                                timeMin,
                                timeMax,
                            );

                            allEvents.push(
                                ...events.map((event) => ({
                                    id: event.id!,
                                    summary: event.summary || 'Busy',
                                    start: event.start?.dateTime || event.start?.date || '',
                                    end: event.end?.dateTime || event.end?.date || '',
                                    calendarId: connection.calendarId,
                                    calendarName: connection.calendarName || 'Unknown Calendar',
                                })),
                            );
                        } catch (error) {
                            console.error(
                                `Error getting events for calendar ${connection.calendarId}:`,
                                error,
                            );
                        }
                    }
                } catch (error) {
                    console.error(`Error checking availability for account ${accountId}:`, error);

                    // Mark calendars as having sync issues
                    for (const { connection } of accountConnections) {
                        await db
                            .update(calendarConnections)
                            .set({
                                syncStatus: 'error',
                                errorMessage:
                                    error instanceof Error ? error.message : 'Unknown error',
                                updatedAt: new Date(),
                            })
                            .where(eq(calendarConnections.id, connection.id));
                    }
                }
            }

            // Sort busy slots by start time and merge overlapping slots
            const mergedBusySlots = this.mergeBusySlots(busySlots);

            // Determine if completely available
            const isAvailable = mergedBusySlots.length === 0;

            return {
                isAvailable,
                busySlots: mergedBusySlots,
                events: allEvents,
            };
        } catch (error) {
            throw new Error(
                `Failed to check availability: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Sync all calendar connections for the user
     */
    async syncAllCalendars(): Promise<{ success: number; errors: string[] }> {
        const connections = await this.getActiveConnections();
        let successCount = 0;
        const errors: string[] = [];

        for (const { connection, account } of connections) {
            if (!account) continue;

            try {
                const calendar = await this.getCalendarApi(account.id);

                // Fetch updated calendar info
                const response = await calendar.calendars.get({
                    calendarId: connection.calendarId,
                });

                const calendarData = response.data;

                // Update calendar info
                await db
                    .update(calendarConnections)
                    .set({
                        calendarName: calendarData.summary,
                        calendarTimeZone: calendarData.timeZone,
                        lastSyncAt: new Date(),
                        syncStatus: 'active',
                        errorMessage: null,
                        updatedAt: new Date(),
                    })
                    .where(eq(calendarConnections.id, connection.id));

                successCount++;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`Calendar ${connection.calendarName}: ${errorMessage}`);

                // Mark calendar as having issues
                await db
                    .update(calendarConnections)
                    .set({
                        syncStatus: 'error',
                        errorMessage: errorMessage,
                        updatedAt: new Date(),
                    })
                    .where(eq(calendarConnections.id, connection.id));
            }
        }

        return { success: successCount, errors };
    }

    /**
     * Fetch calendar lists from all Google accounts and store them in the database
     * This is used for initial calendar discovery and syncing
     */
    async fetchAllCalendarLists(): Promise<{
        accountsSynced: number;
        calendarsSynced: number;
        errors: string[];
    }> {
        try {
            // Get all Google accounts for the user
            const googleAccounts = await db
                .select()
                .from(account)
                .where(and(eq(account.userId, this.userId), eq(account.providerId, 'google')));

            let totalCalendars = 0;
            const errors: string[] = [];

            for (const accountData of googleAccounts) {
                if (!accountData.accessToken) {
                    errors.push(`No access token for account: ${accountData.id}`);
                    continue;
                }

                try {
                    const calendar = await this.getCalendarApi(accountData.id);

                    // Fetch calendars from Google using calendarList.list
                    const response = await calendar.calendarList.list();

                    if (response.status !== 200) {
                        errors.push(
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
                                googleEmail: accountData.accountId, // We'll use the Google account ID as email for now
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
                                    updatedAt: new Date(),
                                },
                            });

                        totalCalendars++;
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    errors.push(
                        `Error syncing calendars for account ${accountData.id}: ${errorMessage}`,
                    );
                }
            }

            return {
                accountsSynced: googleAccounts.length,
                calendarsSynced: totalCalendars,
                errors,
            };
        } catch (error) {
            throw new Error(
                `Failed to fetch calendar lists: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Watch for changes in a calendar
     */
    async watchCalendar(
        calendarId: string,
        webhookUrl: string,
        ttl?: number,
    ): Promise<{ resourceId: string; expiration: number }> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const response = await calendar.events.watch({
                calendarId,
                requestBody: {
                    id: `${this.userId}-${calendarId}-${Date.now()}`,
                    type: 'web_hook',
                    address: webhookUrl,
                    token: `user-${this.userId}`,
                    expiration: ttl ? String(Date.now() + ttl) : undefined,
                },
            });

            return {
                resourceId: response.data.resourceId!,
                expiration: parseInt(response.data.expiration!),
            };
        } catch (error) {
            throw new Error(
                `Failed to watch calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Stop watching a calendar
     */
    async stopWatchingCalendar(calendarId: string, resourceId: string): Promise<void> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            await calendar.channels.stop({
                requestBody: {
                    id: `${this.userId}-${calendarId}`,
                    resourceId,
                },
            });
        } catch (error) {
            throw new Error(
                `Failed to stop watching calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Transform Google Calendar event to our interface
     */
    private transformGoogleEvent(googleEvent: calendar_v3.Schema$Event): CalendarEvent {
        return {
            id: googleEvent.id || undefined,
            summary: googleEvent.summary || '',
            description: googleEvent.description || undefined,
            start: {
                dateTime: googleEvent.start?.dateTime || undefined,
                date: googleEvent.start?.date || undefined,
                timeZone: googleEvent.start?.timeZone || undefined,
            },
            end: {
                dateTime: googleEvent.end?.dateTime || undefined,
                date: googleEvent.end?.date || undefined,
                timeZone: googleEvent.end?.timeZone || undefined,
            },
            attendees: googleEvent.attendees?.map((attendee) => ({
                email: attendee.email!,
                displayName: attendee.displayName || undefined,
                responseStatus: attendee.responseStatus || undefined,
            })),
            location: googleEvent.location || undefined,
            conferenceData: googleEvent.conferenceData || undefined,
            reminders: googleEvent.reminders
                ? {
                      useDefault: googleEvent.reminders.useDefault || undefined,
                      overrides: googleEvent.reminders.overrides?.map((override) => ({
                          method: override.method || 'email',
                          minutes: override.minutes || 0,
                      })),
                  }
                : undefined,
        };
    }

    /**
     * Merge overlapping busy slots
     */
    private mergeBusySlots(
        busySlots: Array<{ start: string; end: string }>,
    ): Array<{ start: string; end: string }> {
        if (busySlots.length === 0) return [];

        // Sort by start time
        const sorted = [...busySlots].sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
        );

        const merged: Array<{ start: string; end: string }> = [sorted[0]];

        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const previous = merged[merged.length - 1];

            // Check if current overlaps with previous
            if (new Date(current.start) <= new Date(previous.end)) {
                // Merge by extending the end time if necessary
                previous.end =
                    new Date(current.end) > new Date(previous.end) ? current.end : previous.end;
            } else {
                // No overlap, add as new slot
                merged.push(current);
            }
        }

        return merged;
    }
}

// Utility functions
export function createCalendarService(userId: string): GoogleCalendarService {
    return new GoogleCalendarService(userId);
}

export async function getCalendarServiceForUser(
    headers: Headers,
): Promise<GoogleCalendarService | null> {
    try {
        const session = await auth.api.getSession({ headers });
        if (!session) {
            return null;
        }
        return new GoogleCalendarService(session.user.id);
    } catch (error) {
        console.error('Error getting calendar service for user:', error);
        return null;
    }
}
