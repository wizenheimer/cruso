import { google, calendar_v3 } from 'googleapis';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { account } from '@/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { GoogleAuthManager } from './manager';
import { formatInTimeZone } from 'date-fns-tz';
import { preferenceService } from '../preferences';
import { RRule, rrulestr, Frequency, Weekday } from 'rrule';

// ==================================================
// Recurrence Rule Interface
// ==================================================
export interface RecurrenceRule {
    freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'HOURLY' | 'MINUTELY' | 'SECONDLY';
    dtstart?: Date;
    interval?: number;
    wkst?: 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';
    count?: number;
    until?: Date;
    bysetpos?: number[];
    bymonth?: number[];
    bymonthday?: number[];
    byyearday?: number[];
    byweekno?: number[];
    byweekday?: ('MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU')[];
    byhour?: number[];
    byminute?: number[];
    bysecond?: number[];
    byeaster?: number | null;
}

// ==================================================
// Calendar Event Interface
// ==================================================
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

// ==================================================
// Recurring Calendar Event Interface
// ==================================================
export interface RecurringCalendarEvent extends CalendarEvent {
    recurrence?: RecurrenceRule[];
    recurringEventId?: string;
    originalStartTime?: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
}

// ==================================================
// Calendar Info Interface
// ==================================================
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

// ==================================================
// Availability Result Interface
// ==================================================
export interface AvailabilityResult {
    isAvailable: boolean;
    timezone: string;
    busySlots: Array<{ start: string; end: string }>;
    freeSlots: Array<{ start: string; end: string }>;
    events: Array<{
        id: string;
        summary: string;
        start: string;
        end: string;
        calendarId: string;
        calendarName: string;
    }>;
}

// ==================================================
// Block Availability Result Interface
// ==================================================
export interface BlockAvailabilityResult {
    state: 'success' | 'error';
    rescheduledEventCount?: number;
    rescheduledEventDetails?: CalendarEvent[];
    blockEventDetails?: CalendarEvent;
    message?: string;
}

// ==================================================
// Clear Availability Result Interface
// ==================================================
export interface ClearAvailabilityResult {
    state: 'success' | 'error';
    rescheduledEventCount?: number;
    rescheduledEventDetails?: CalendarEvent[];
}

// ==================================================
// Google Calendar Service Class
// ==================================================
export class GoogleCalendarService {
    private userId: string;
    private authManager: GoogleAuthManager;
    private calendarCache: Map<string, calendar_v3.Calendar> = new Map();

    constructor(userId: string) {
        console.log('┌─ [CALENDAR_SERVICE] Initializing service...', { userId });
        this.userId = userId;
        this.authManager = new GoogleAuthManager();
        console.log('└─ [CALENDAR_SERVICE] Service initialized');
    }

    /**
     * Get calendar API instance for a specific account
     */
    private async getCalendarApi(accountId: string): Promise<calendar_v3.Calendar> {
        console.log('┌─ [CALENDAR_SERVICE] Getting calendar API instance...', { accountId });

        // Check cache first
        if (this.calendarCache.has(accountId)) {
            console.log('└─ [CALENDAR_SERVICE] Using cached calendar API instance');
            return this.calendarCache.get(accountId)!;
        }

        console.log('├─ [CALENDAR_SERVICE] Creating new calendar API instance...');
        const authClient = await this.authManager.getAuthenticatedClient(accountId);
        const calendar = google.calendar({ version: 'v3', auth: authClient });

        // Cache the instance
        this.calendarCache.set(accountId, calendar);
        console.log('└─ [CALENDAR_SERVICE] Calendar API instance created and cached');

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
        console.log('┌─ [CALENDAR_SERVICE] Listing calendars for user...', { userId: this.userId });
        try {
            console.log('├─ [CALENDAR_SERVICE] Getting active connections...');
            const connections = await this.getActiveConnections();
            console.log('├─ [CALENDAR_SERVICE] Found connections:', { count: connections.length });
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
                        .where(
                            and(
                                eq(calendarConnections.id, connection.id),
                                eq(calendarConnections.isActive, true),
                            ),
                        );
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
                        .where(
                            and(
                                eq(calendarConnections.id, connection.id),
                                eq(calendarConnections.isActive, true),
                            ),
                        );
                }
            }

            console.log('└─ [CALENDAR_SERVICE] Successfully listed calendars:', {
                count: calendars.length,
            });
            return calendars;
        } catch (error) {
            console.log('└─ [CALENDAR_SERVICE] Failed to list calendars:', error);
            throw new Error(
                `Failed to list calendars: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get the primary calendar ID for the user
     */
    private async getPrimaryCalendarId(): Promise<string> {
        // Get user preferences to find primary account
        const userPreferences = await preferenceService.getPreferences(this.userId);
        const primaryAccountId = userPreferences.data?.preferences.primaryAccountId;

        if (!primaryAccountId) {
            throw new Error('Primary account not found');
        }

        // Get primary calendar connection
        const primaryCalendarConnections = await db
            .select()
            .from(calendarConnections)
            .where(
                and(
                    eq(calendarConnections.accountId, primaryAccountId),
                    eq(calendarConnections.isActive, true),
                    eq(calendarConnections.isPrimary, true),
                ),
            )
            .limit(1);

        if (primaryCalendarConnections.length === 0) {
            throw new Error('No primary calendar found');
        }

        return primaryCalendarConnections[0].calendarId;
    }

    /**
     * Get events from the primary calendar
     */
    async getEventsFromPrimaryCalendar(
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
    ): Promise<{ events: CalendarEvent[]; nextPageToken?: string; calendarId: string }> {
        console.log('┌─ [GET_PRIMARY_EVENTS] Starting...', { timeMin, timeMax });

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [GET_PRIMARY_EVENTS] Primary calendar:', primaryCalendarId);

            const result = await this.getEvents(primaryCalendarId, timeMin, timeMax, options);

            console.log('└─ [GET_PRIMARY_EVENTS] Retrieved events:', result.events.length);

            return {
                ...result,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [GET_PRIMARY_EVENTS] Error:', error);
            throw new Error(
                `Failed to get primary calendar events: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get events from a specific calendar
     */
    async getEvents(
        calendarId: string, // calendarId is the id of the calendar to get events from
        timeMin: string, // timeMin is the start time of the events to get
        timeMax: string, // timeMax is the end time of the events to get
        options?: {
            maxResults?: number; // maxResults is the maximum number of events to return
            pageToken?: string; // pageToken is the token to get the next page of events
            q?: string; // q is the query to search for events
            showDeleted?: boolean; // showDeleted is whether to show deleted events
            singleEvents?: boolean; // singleEvents is whether to show single events
            orderBy?: 'startTime' | 'updated'; // orderBy is the order of the events
            timeZone?: string; // timeZone is the timezone of the events
            alwaysIncludeEmail?: boolean; // alwaysIncludeEmail is whether to always include the email of the events
            iCalUID?: string; // iCalUID is the iCalUID of the events
        },
    ): Promise<{ events: CalendarEvent[]; nextPageToken?: string; nextSyncToken?: string }> {
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
                timeZone: options?.timeZone,
                alwaysIncludeEmail: options?.alwaysIncludeEmail ?? false,
                iCalUID: options?.iCalUID,
            });

            const events = (response.data.items || []).map((event) =>
                this.transformGoogleEvent(event, options?.timeZone),
            );

            return {
                events,
                nextPageToken: response.data.nextPageToken || undefined,
                nextSyncToken: response.data.nextSyncToken || undefined,
            };
        } catch (error) {
            throw new Error(
                `Failed to get events: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Get single event from a specific calendar
     */
    async getEvent(
        calendarId: string,
        eventId: string,
        options?: {
            timeZone?: string;
            alwaysIncludeEmail?: boolean;
            maxAttendees?: number;
        },
    ): Promise<CalendarEvent> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const response = await calendar.events.get({
                calendarId,
                eventId,
                timeZone: options?.timeZone,
                alwaysIncludeEmail: options?.alwaysIncludeEmail,
                maxAttendees: options?.maxAttendees,
            });

            if (!response.data) {
                throw new Error('Event not found');
            }

            return this.transformGoogleEvent(response.data, options?.timeZone);
        } catch (error) {
            throw new Error(
                `Failed to get event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Find events by iCalUID
     */
    async findEventsByICalUID(
        iCalUID: string,
        options?: {
            timeZone?: string;
            includeDeleted?: boolean;
        },
    ): Promise<Map<string, CalendarEvent[]>> {
        const connections = await this.getActiveConnections();
        const eventsByCalendar = new Map<string, CalendarEvent[]>();

        for (const { connection, account } of connections) {
            if (!account) continue;

            try {
                const { events } = await this.getEvents(
                    connection.calendarId,
                    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
                    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year future
                    {
                        iCalUID,
                        timeZone: options?.timeZone,
                        showDeleted: options?.includeDeleted,
                        singleEvents: false, // Get recurring events as well
                    },
                );

                if (events.length > 0) {
                    eventsByCalendar.set(connection.calendarId, events);
                }
            } catch (error) {
                console.error(`Error searching calendar ${connection.calendarId}:`, error);
            }
        }

        return eventsByCalendar;
    }

    /**
     * Get events that have been updated since a specific time
     */
    async getUpdatedEvents(
        calendarId: string,
        updatedMin: string,
        options?: {
            maxResults?: number;
            pageToken?: string;
            syncToken?: string;
            timeZone?: string;
        },
    ): Promise<{
        events: CalendarEvent[];
        deletedEvents: string[];
        nextPageToken?: string;
        nextSyncToken?: string;
    }> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const response = await calendar.events.list({
                calendarId,
                updatedMin,
                maxResults: options?.maxResults || 250,
                pageToken: options?.pageToken,
                syncToken: options?.syncToken,
                timeZone: options?.timeZone,
                showDeleted: true, // Important for sync operations
            });

            const events: CalendarEvent[] = [];
            const deletedEvents: string[] = [];

            for (const item of response.data.items || []) {
                if (item.status === 'cancelled') {
                    deletedEvents.push(item.id!);
                } else {
                    events.push(this.transformGoogleEvent(item, options?.timeZone));
                }
            }

            return {
                events,
                deletedEvents,
                nextPageToken: response.data.nextPageToken || undefined,
                nextSyncToken: response.data.nextSyncToken || undefined,
            };
        } catch (error) {
            throw new Error(
                `Failed to get updated events: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Create an event in the primary calendar
     */
    async createEventInPrimaryCalendar(
        event: CalendarEvent,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
            conferenceDataVersion?: number;
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        console.log('┌─ [CREATE_PRIMARY_EVENT] Starting...', {
            summary: event.summary,
            start: event.start,
            end: event.end,
        });

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CREATE_PRIMARY_EVENT] Primary calendar:', primaryCalendarId);

            const createdEvent = await this.createEvent(primaryCalendarId, event, options);

            console.log('└─ [CREATE_PRIMARY_EVENT] Event created:', createdEvent.id);

            return {
                ...createdEvent,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [CREATE_PRIMARY_EVENT] Error:', error);
            throw new Error(
                `Failed to create event in primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
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
        console.log('┌─ [CALENDAR_SERVICE] Creating event...', {
            calendarId,
            summary: event.summary,
        });
        try {
            console.log('├─ [CALENDAR_SERVICE] Getting calendar connection...');
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                console.log('└─ [CALENDAR_SERVICE] No account found for calendar connection');
                throw new Error('No account found for calendar connection');
            }
            console.log('├─ [CALENDAR_SERVICE] Account found, getting calendar API...');

            const calendar = await this.getCalendarApi(connectionData.account.id);

            console.log('├─ [CALENDAR_SERVICE] Inserting event into calendar...');
            const response = await calendar.events.insert({
                calendarId,
                requestBody: event as calendar_v3.Schema$Event,
                sendUpdates: options?.sendUpdates || 'none',
                conferenceDataVersion: options?.conferenceDataVersion,
            });

            console.log('└─ [CALENDAR_SERVICE] Event created successfully:', {
                eventId: response.data.id,
            });
            return this.transformGoogleEvent(response.data);
        } catch (error) {
            console.log('└─ [CALENDAR_SERVICE] Failed to create event:', error);
            throw new Error(
                `Failed to create event: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Update an event in the primary calendar
     */
    async updateEventInPrimaryCalendar(
        eventId: string,
        event: Partial<CalendarEvent>,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        console.log('┌─ [UPDATE_PRIMARY_EVENT] Starting...', {
            eventId,
            updates: Object.keys(event),
        });

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [UPDATE_PRIMARY_EVENT] Primary calendar:', primaryCalendarId);

            const updatedEvent = await this.updateEvent(primaryCalendarId, eventId, event, options);

            console.log('└─ [UPDATE_PRIMARY_EVENT] Event updated successfully');

            return {
                ...updatedEvent,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [UPDATE_PRIMARY_EVENT] Error:', error);
            throw new Error(
                `Failed to update event in primary calendar: ${
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
     * Delete an event from the primary calendar
     */
    async deleteEventFromPrimaryCalendar(
        eventId: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<{ calendarId: string }> {
        console.log('┌─ [DELETE_PRIMARY_EVENT] Starting...', { eventId });

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [DELETE_PRIMARY_EVENT] Primary calendar:', primaryCalendarId);

            await this.deleteEvent(primaryCalendarId, eventId, options);

            console.log('└─ [DELETE_PRIMARY_EVENT] Event deleted successfully');

            return {
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [DELETE_PRIMARY_EVENT] Error:', error);
            throw new Error(
                `Failed to delete event from primary calendar: ${
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
     * Reschedule an event in the primary calendar
     */
    async rescheduleEventInPrimaryCalendar(
        eventId: string,
        startDateTime: string,
        endDateTime: string,
        timeZone: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        console.log('┌─ [RESCHEDULE_PRIMARY_EVENT] Starting...', {
            eventId,
            startDateTime,
            endDateTime,
        });

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [RESCHEDULE_PRIMARY_EVENT] Primary calendar:', primaryCalendarId);

            const updatedEvent = await this.updateEvent(
                primaryCalendarId,
                eventId,
                {
                    start: {
                        dateTime: startDateTime,
                        timeZone,
                    },
                    end: {
                        dateTime: endDateTime,
                        timeZone,
                    },
                },
                options,
            );

            console.log('└─ [RESCHEDULE_PRIMARY_EVENT] Event updated successfully');

            return {
                ...updatedEvent,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [RESCHEDULE_PRIMARY_EVENT] Error:', error);
            throw new Error(
                `Failed to reschedule event in primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Create an event in primary calendar with minimal options
     * Ideal for forwarding events to the primary calendar for creation
     */
    async quickCreateEventInPrimaryCalendar(
        summary: string,
        startDateTime: string,
        endDateTime: string,
        options?: {
            description?: string;
            location?: string;
            attendees?: string[];
            sendUpdates?: 'all' | 'externalOnly' | 'none';
            conferenceDataVersion?: number;
            createConference?: boolean;
            colorId?: string;
            reminders?: {
                useDefault?: boolean;
                overrides?: Array<{
                    method: 'email' | 'popup';
                    minutes: number;
                }>;
            };
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        console.log('┌─ [QUICK_CREATE_PRIMARY_EVENT] Starting...', {
            summary,
            startDateTime,
            endDateTime,
        });

        const event: CalendarEvent = {
            summary,
            start: {
                dateTime: startDateTime,
            },
            end: {
                dateTime: endDateTime,
            },
            description: options?.description,
            location: options?.location,
            attendees: options?.attendees?.map((email) => ({ email })),
            reminders: options?.reminders || {
                useDefault: true,
            },
        };

        // Add conference data if requested
        if (options?.createConference) {
            event.conferenceData = {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet',
                    },
                },
            };
        }

        return this.createEventInPrimaryCalendar(event, {
            sendUpdates: options?.sendUpdates,
            conferenceDataVersion: options?.createConference ? 1 : options?.conferenceDataVersion,
        });
    }

    /**
     * Batch operations for primary calendar
     */
    async performBatchOperationsOnPrimaryCalendar(
        operations: Array<{
            type: 'create' | 'update' | 'delete';
            eventId?: string;
            event?: CalendarEvent | Partial<CalendarEvent>;
        }>,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<{
        successful: Array<{ operation: any; result?: any }>;
        failed: Array<{ operation: any; error: string }>;
    }> {
        console.log('┌─ [BATCH_PRIMARY_OPERATIONS] Starting...', {
            operationCount: operations.length,
            types: operations.map((op) => op.type),
        });

        const successful: Array<{ operation: any; result?: any }> = [];
        const failed: Array<{ operation: any; error: string }> = [];

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [BATCH_PRIMARY_OPERATIONS] Primary calendar:', primaryCalendarId);

            for (const operation of operations) {
                try {
                    let result;

                    switch (operation.type) {
                        case 'create':
                            if (!operation.event) {
                                throw new Error('Event data required for create operation');
                            }
                            result = await this.createEvent(
                                primaryCalendarId,
                                operation.event as CalendarEvent,
                                { sendUpdates: options?.sendUpdates },
                            );
                            break;

                        case 'update':
                            if (!operation.eventId || !operation.event) {
                                throw new Error('Event ID and data required for update operation');
                            }
                            result = await this.updateEvent(
                                primaryCalendarId,
                                operation.eventId,
                                operation.event as Partial<CalendarEvent>,
                                { sendUpdates: options?.sendUpdates },
                            );
                            break;

                        case 'delete':
                            if (!operation.eventId) {
                                throw new Error('Event ID required for delete operation');
                            }
                            await this.deleteEvent(primaryCalendarId, operation.eventId, {
                                sendUpdates: options?.sendUpdates,
                            });
                            result = { deleted: true, eventId: operation.eventId };
                            break;
                    }

                    successful.push({ operation, result });
                } catch (error) {
                    failed.push({
                        operation,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }

            console.log('└─ [BATCH_PRIMARY_OPERATIONS] Completed:', {
                successful: successful.length,
                failed: failed.length,
            });

            return { successful, failed };
        } catch (error) {
            console.error('└─ [BATCH_PRIMARY_OPERATIONS] Fatal error:', error);
            throw new Error(
                `Failed to execute batch operations: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get all the instances of a recurring event
     */
    async getRecurringEventInstances(
        calendarId: string,
        recurringEventId: string,
        timeMin: string,
        timeMax: string,
        options?: {
            maxResults?: number;
            pageToken?: string;
            timeZone?: string;
            showDeleted?: boolean;
        },
    ): Promise<{ instances: RecurringCalendarEvent[]; nextPageToken?: string }> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const response = await calendar.events.instances({
                calendarId,
                eventId: recurringEventId,
                timeMin,
                timeMax,
                maxResults: options?.maxResults || 250,
                pageToken: options?.pageToken,
                timeZone: options?.timeZone,
                showDeleted: options?.showDeleted,
            });

            const instances = (response.data.items || []).map(
                (event) =>
                    this.transformGoogleEvent(event, options?.timeZone) as RecurringCalendarEvent,
            );

            return {
                instances,
                nextPageToken: response.data.nextPageToken || undefined,
            };
        } catch (error) {
            throw new Error(
                `Failed to get recurring event instances: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Check availability across all user's calendars
     */
    async checkAvailabilityBlock(
        timeMinRFC3339: string,
        timeMaxRFC3339: string,
        options: {
            includeCalendarIds?: string[];
            excludeCalendarIds?: string[];
            responseTimezone?: string;
            timeDurationMinutes?: number;
            includeEvents?: boolean;
        } = {},
    ): Promise<AvailabilityResult> {
        const responseTimezone = options.responseTimezone || 'UTC';
        const includeEvents = options.includeEvents || false;
        const duration =
            options.timeDurationMinutes ||
            Math.floor(
                (new Date(timeMaxRFC3339).getTime() - new Date(timeMinRFC3339).getTime()) /
                    (1000 * 60),
            );

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
                            timeMin: timeMinRFC3339,
                            timeMax: timeMaxRFC3339,
                            timeZone: responseTimezone,
                            items: accountConnections.map(({ connection }) => ({
                                id: connection.calendarId,
                            })),
                        },
                    });

                    // Process freebusy results
                    for (const { connection } of accountConnections) {
                        const calendarBusy =
                            freebusyResponse.data.calendars?.[connection.calendarId]?.busy || [];

                        // Google returns times in the requested timezone already when timeZone is specified
                        busySlots.push(
                            ...calendarBusy.map((slot) => ({
                                start: slot.start!,
                                end: slot.end!,
                            })),
                        );

                        // Also get detailed events for context
                        if (includeEvents) {
                            try {
                                const { events } = await this.getEvents(
                                    connection.calendarId,
                                    timeMinRFC3339,
                                    timeMaxRFC3339,
                                );

                                allEvents.push(
                                    ...events.map((event) => ({
                                        id: event.id!,
                                        summary: event.summary || 'Busy',
                                        start: this.convertToTimezone(
                                            event.start?.dateTime || event.start?.date || '',
                                            responseTimezone,
                                        ),
                                        end: this.convertToTimezone(
                                            event.end?.dateTime || event.end?.date || '',
                                            responseTimezone,
                                        ),
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

            // Calculate free slots based on duration
            const freeSlots = this.calculateFreeSlots(
                timeMinRFC3339,
                timeMaxRFC3339,
                mergedBusySlots,
                duration,
                responseTimezone,
            );

            // Determine if completely available (considering duration)
            const isAvailable = freeSlots.length > 0;

            return {
                isAvailable,
                busySlots: mergedBusySlots,
                freeSlots,
                events: allEvents,
                timezone: responseTimezone,
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
     * Create an availability block in the primary calendar
     * This method intelligently finds or creates space for the requested time block
     * If no event parameters are provided, it will only clear the time slot without creating a block
     */
    async createAvailabilityBlock(
        timeMinRFC3339: string, // start time formatted as RFC3339
        timeMaxRFC3339: string, // end time formatted as RFC3339
        options: {
            responseTimezone?: string; // timezone for the response
            timeDurationMinutes?: number; // duration of the block in minutes
            eventSummary?: string; // summary of the block
            eventDescription?: string; // description of the block
            eventAttendees?: string[]; // attendees of the block
            eventLocation?: string; // location of the block
            eventConference?: boolean; // whether to create a conference for the block
            eventPrivate?: boolean; // whether to make the block private
            eventColorId?: string; // color of the block
            createBlock?: boolean; // whether to create a block event
        } = {},
    ): Promise<BlockAvailabilityResult> {
        const responseTimezone = options.responseTimezone || 'UTC';
        const duration =
            options.timeDurationMinutes ||
            Math.floor(
                (new Date(timeMaxRFC3339).getTime() - new Date(timeMinRFC3339).getTime()) /
                    (1000 * 60),
            );

        // Determine if we should create a block event
        // If createBlock is explicitly false, don't create
        // If createBlock is true or any event parameters are provided, create the block
        const shouldCreateBlock =
            options.createBlock !== false &&
            (options.createBlock === true ||
                options.eventSummary !== undefined ||
                options.eventDescription !== undefined ||
                options.eventAttendees !== undefined ||
                options.eventLocation !== undefined ||
                options.eventConference !== undefined ||
                options.eventPrivate !== undefined ||
                options.eventColorId !== undefined);

        console.log('┌─ [CREATE_AVAILABILITY_BLOCK] Starting...', {
            timeMin: timeMinRFC3339,
            timeMax: timeMaxRFC3339,
            duration,
            responseTimezone,
            shouldCreateBlock,
        });

        const rescheduledEventDetails: CalendarEvent[] = [];
        let blockEventDetails: CalendarEvent | null = null;

        try {
            // Get user preferences to find primary account
            const userPreferences = await preferenceService.getPreferences(this.userId);
            const primaryAccountId = userPreferences.data?.preferences.primaryAccountId;

            if (!primaryAccountId) {
                throw new Error('Primary account not found');
            }

            console.log('├─ [CREATE_AVAILABILITY_BLOCK] Primary account ID:', primaryAccountId);

            // Get primary calendar connections
            const primaryCalendarConnections = await db
                .select()
                .from(calendarConnections)
                .where(
                    and(
                        eq(calendarConnections.accountId, primaryAccountId),
                        eq(calendarConnections.isActive, true),
                        eq(calendarConnections.includeInAvailability, true),
                        eq(calendarConnections.isPrimary, true),
                    ),
                );

            if (primaryCalendarConnections.length === 0) {
                throw new Error('No primary calendar found');
            }

            console.log(
                '├─ [CREATE_AVAILABILITY_BLOCK] Primary calendar:',
                primaryCalendarConnections[0].calendarId,
            );

            const calendar = await this.getCalendarApi(primaryAccountId);
            const primaryCalendarId = primaryCalendarConnections[0].calendarId;

            // Calculate if duration equals entire time slot
            const totalTimeSlotMinutes = Math.floor(
                (new Date(timeMaxRFC3339).getTime() - new Date(timeMinRFC3339).getTime()) /
                    (1000 * 60),
            );
            const isFullSlotBlock = duration === totalTimeSlotMinutes;

            console.log('├─ [CREATE_AVAILABILITY_BLOCK] Time slot analysis:', {
                totalTimeSlotMinutes,
                requestedDuration: duration,
                isFullSlotBlock,
            });

            // Build event request body
            const eventRequestBody = {
                summary: options.eventSummary || 'Blocked',
                description: options.eventDescription || 'Time blocked for availability',
                attendees: options.eventAttendees?.map((email) => ({ email })),
                conferenceData: options.eventConference
                    ? {
                          createRequest: {
                              requestId: `block-${Date.now()}`,
                              conferenceSolutionKey: {
                                  type: 'hangoutsMeet',
                              },
                          },
                      }
                    : undefined,
                location: options.eventLocation,
                colorId: options.eventColorId || '8', // Default to graphite
                status: 'confirmed',
                transparency: 'opaque',
                visibility: options.eventPrivate ? 'private' : 'default',
            };

            // Optimization: If blocking entire time slot, just delete all events
            if (isFullSlotBlock) {
                console.log(
                    '├─ [CREATE_AVAILABILITY_BLOCK] Full slot block requested, clearing all events...',
                );

                // Get all events in the time range
                const { events } = await this.getEvents(
                    primaryCalendarId,
                    timeMinRFC3339,
                    timeMaxRFC3339,
                    {
                        singleEvents: true,
                        orderBy: 'startTime',
                    },
                );

                console.log(
                    '├─ [CREATE_AVAILABILITY_BLOCK] Found events to delete:',
                    events.length,
                );

                // Bulk delete all events
                for (const event of events) {
                    await this.deleteEvent(primaryCalendarId, event.id!, {
                        sendUpdates: 'all',
                    });
                    rescheduledEventDetails.push(event);
                }

                // Create block event for entire time slot only if requested
                if (shouldCreateBlock) {
                    const response = await calendar.events.insert({
                        calendarId: primaryCalendarId,
                        conferenceDataVersion: options.eventConference ? 1 : undefined,
                        requestBody: {
                            ...eventRequestBody,
                            start: {
                                dateTime: timeMinRFC3339,
                                timeZone: responseTimezone,
                            },
                            end: {
                                dateTime: timeMaxRFC3339,
                                timeZone: responseTimezone,
                            },
                        },
                    });

                    blockEventDetails = this.transformGoogleEvent(response.data);
                    console.log('├─ [CREATE_AVAILABILITY_BLOCK] Block event created');
                }

                console.log('└─ [CREATE_AVAILABILITY_BLOCK] Full slot processing completed');

                return {
                    state: 'success',
                    rescheduledEventCount: rescheduledEventDetails.length,
                    rescheduledEventDetails,
                    blockEventDetails: blockEventDetails || undefined,
                    message: shouldCreateBlock
                        ? `Successfully blocked entire time slot. ${rescheduledEventDetails.length} events were rescheduled.`
                        : `Successfully cleared time slot. ${rescheduledEventDetails.length} events were removed.`,
                };
            }

            // For partial blocks, check current availability
            const availabilityResult = await this.checkAvailabilityBlock(
                timeMinRFC3339,
                timeMaxRFC3339,
                {
                    includeCalendarIds: [primaryCalendarId],
                    responseTimezone,
                    timeDurationMinutes: duration,
                },
            );

            console.log('├─ [CREATE_AVAILABILITY_BLOCK] Current availability:', {
                isAvailable: availabilityResult.isAvailable,
                freeSlotCount: availabilityResult.freeSlots.length,
            });

            // Case 1: If there's a free slot that fits our duration AND we want to create a block
            if (availabilityResult.freeSlots.length > 0 && shouldCreateBlock) {
                const freeSlot = availabilityResult.freeSlots[0];
                const blockStart = new Date(freeSlot.start);
                const blockEnd = new Date(blockStart.getTime() + duration * 60 * 1000);

                // Make sure block doesn't exceed free slot
                const freeSlotEnd = new Date(freeSlot.end);
                if (blockEnd > freeSlotEnd) {
                    blockEnd.setTime(freeSlotEnd.getTime());
                }

                console.log('├─ [CREATE_AVAILABILITY_BLOCK] Creating block in free slot:', {
                    start: blockStart.toISOString(),
                    end: blockEnd.toISOString(),
                });

                const response = await calendar.events.insert({
                    calendarId: primaryCalendarId,
                    conferenceDataVersion: options.eventConference ? 1 : undefined,
                    requestBody: {
                        ...eventRequestBody,
                        start: {
                            dateTime: blockStart.toISOString(),
                            timeZone: responseTimezone,
                        },
                        end: {
                            dateTime: blockEnd.toISOString(),
                            timeZone: responseTimezone,
                        },
                    },
                });

                blockEventDetails = this.transformGoogleEvent(response.data);

                console.log(
                    '└─ [CREATE_AVAILABILITY_BLOCK] Block created in free slot successfully',
                );

                return {
                    state: 'success',
                    rescheduledEventCount: 0,
                    rescheduledEventDetails: [],
                    blockEventDetails: blockEventDetails,
                    message: 'Successfully created block in available time slot.',
                };
            }

            // If there's a free slot but we don't want to create a block
            if (availabilityResult.freeSlots.length > 0 && !shouldCreateBlock) {
                console.log(
                    '└─ [CREATE_AVAILABILITY_BLOCK] Free slot available, no block requested',
                );
                return {
                    state: 'success',
                    rescheduledEventCount: 0,
                    rescheduledEventDetails: [],
                    message: 'Time slot is already available. No changes made.',
                };
            }

            // Case 2: No free slots - need to reschedule existing events
            console.log(
                '├─ [CREATE_AVAILABILITY_BLOCK] No free slots available, analyzing events to reschedule...',
            );

            // Get all events in the time range
            const { events } = await this.getEvents(
                primaryCalendarId,
                timeMinRFC3339,
                timeMaxRFC3339,
                {
                    singleEvents: true,
                    orderBy: 'startTime',
                },
            );

            console.log('├─ [CREATE_AVAILABILITY_BLOCK] Found events:', events.length);

            if (events.length === 0) {
                throw new Error('No events found in the specified time range');
            }

            // Find the best event(s) to reschedule
            const eventsToReschedule = this.findOptimalEventsToReschedule(
                events,
                duration,
                timeMinRFC3339,
                timeMaxRFC3339,
            );

            if (eventsToReschedule.length === 0) {
                throw new Error('No suitable events found to reschedule');
            }

            console.log(
                '├─ [CREATE_AVAILABILITY_BLOCK] Events to reschedule:',
                eventsToReschedule.length,
            );

            // Calculate the exact block start and end based on events being replaced
            const firstEventStart = eventsToReschedule[0].start?.dateTime
                ? new Date(eventsToReschedule[0].start.dateTime)
                : new Date(eventsToReschedule[0].start?.date || timeMinRFC3339);

            // If we're replacing multiple events, use the end of the last event or duration, whichever is smaller
            const lastEvent = eventsToReschedule[eventsToReschedule.length - 1];
            const lastEventEnd = lastEvent.end?.dateTime
                ? new Date(lastEvent.end.dateTime)
                : new Date(lastEvent.end?.date || timeMaxRFC3339);

            const blockStart = firstEventStart;
            const blockEnd = new Date(
                Math.min(blockStart.getTime() + duration * 60 * 1000, lastEventEnd.getTime()),
            );

            // Delete the selected events
            for (const event of eventsToReschedule) {
                console.log('├─ [CREATE_AVAILABILITY_BLOCK] Deleting event:', event.summary);

                await this.deleteEvent(primaryCalendarId, event.id!, {
                    sendUpdates: 'all',
                });

                rescheduledEventDetails.push(event);
            }

            console.log('├─ [CREATE_AVAILABILITY_BLOCK] Creating block event:', {
                start: blockStart.toISOString(),
                end: blockEnd.toISOString(),
            });

            // Create the block event only if requested
            if (shouldCreateBlock) {
                const response = await calendar.events.insert({
                    calendarId: primaryCalendarId,
                    conferenceDataVersion: options.eventConference ? 1 : undefined,
                    requestBody: {
                        ...eventRequestBody,
                        start: {
                            dateTime: blockStart.toISOString(),
                            timeZone: responseTimezone,
                        },
                        end: {
                            dateTime: blockEnd.toISOString(),
                            timeZone: responseTimezone,
                        },
                    },
                });

                blockEventDetails = this.transformGoogleEvent(response.data);
                console.log('├─ [CREATE_AVAILABILITY_BLOCK] Block event created');
            }

            console.log('└─ [CREATE_AVAILABILITY_BLOCK] Processing completed');

            return {
                state: 'success',
                rescheduledEventCount: rescheduledEventDetails.length,
                rescheduledEventDetails,
                blockEventDetails: blockEventDetails || undefined,
                message: shouldCreateBlock
                    ? `Successfully created block by rescheduling ${rescheduledEventDetails.length} event(s).`
                    : `Successfully cleared time slot by removing ${rescheduledEventDetails.length} event(s).`,
            };
        } catch (error) {
            console.error('└─ [CREATE_AVAILABILITY_BLOCK] Error:', error);

            return {
                state: 'error',
                message: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Find optimal events to reschedule based on criteria
     */
    private findOptimalEventsToReschedule(
        events: CalendarEvent[],
        requiredDurationMinutes: number,
        timeMin: string,
        timeMax: string,
    ): CalendarEvent[] {
        const requiredDurationMs = requiredDurationMinutes * 60 * 1000;

        // Score events based on disruption impact
        const scoredEvents = events.map((event) => {
            const startTime = event.start?.dateTime
                ? new Date(event.start.dateTime).getTime()
                : new Date(event.start?.date || timeMin).getTime();

            const endTime = event.end?.dateTime
                ? new Date(event.end.dateTime).getTime()
                : new Date(event.end?.date || timeMax).getTime();

            const duration = endTime - startTime;
            const attendeeCount = event.attendees?.length || 0;

            // Lower score is better (less disruptive)
            let score = 0;

            // Penalize based on number of attendees
            score += attendeeCount * 100;

            // Penalize longer events
            score += duration / (60 * 1000); // Add 1 point per minute

            return {
                event,
                score,
                duration,
            };
        });

        // Sort by score (ascending - least disruptive first)
        scoredEvents.sort((a, b) => a.score - b.score);

        // First, try to find a single event that fits
        const singleEvent = scoredEvents.find((item) => item.duration >= requiredDurationMs);
        if (singleEvent) {
            return [singleEvent.event];
        }

        // If no single event fits, find contiguous events
        return this.findMinimalContiguousEvents(scoredEvents, requiredDurationMs);
    }

    /**
     * Find minimal contiguous events that meet duration requirement
     */
    private findMinimalContiguousEvents(
        scoredEvents: Array<{ event: CalendarEvent; score: number; duration: number }>,
        requiredDurationMs: number,
    ): CalendarEvent[] {
        // Sort by start time for contiguous checking
        const sortedByTime = [...scoredEvents].sort((a, b) => {
            const aStart = new Date(a.event.start?.dateTime || a.event.start?.date || 0).getTime();
            const bStart = new Date(b.event.start?.dateTime || b.event.start?.date || 0).getTime();
            return aStart - bStart;
        });

        let bestCombination: CalendarEvent[] = [];
        let bestScore = Infinity;

        // Try different starting points
        for (let i = 0; i < sortedByTime.length; i++) {
            let currentDuration = 0;
            let currentScore = 0;
            const currentCombination: CalendarEvent[] = [];

            // Build contiguous block starting from index i
            for (let j = i; j < sortedByTime.length; j++) {
                const current = sortedByTime[j];

                // Check if events are contiguous (within 30 minutes)
                if (currentCombination.length > 0) {
                    const lastEvent = currentCombination[currentCombination.length - 1];
                    const lastEnd = new Date(
                        lastEvent.end?.dateTime || lastEvent.end?.date || 0,
                    ).getTime();
                    const currentStart = new Date(
                        current.event.start?.dateTime || current.event.start?.date || 0,
                    ).getTime();

                    if (currentStart - lastEnd > 30 * 60 * 1000) {
                        break; // Not contiguous
                    }
                }

                currentCombination.push(current.event);
                currentDuration += current.duration;
                currentScore += current.score;

                // If we've met the duration requirement
                if (currentDuration >= requiredDurationMs) {
                    if (currentScore < bestScore) {
                        bestScore = currentScore;
                        bestCombination = [...currentCombination];
                    }
                    break;
                }
            }
        }

        return bestCombination;
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

    /**
     * Calculate free slots based on busy slots and duration
     */
    private calculateFreeSlots(
        timeMinRFC3339: string,
        timeMaxRFC3339: string,
        busySlots: Array<{ start: string; end: string }>,
        durationMinutes: number,
        timezone: string,
    ): Array<{ start: string; end: string }> {
        const freeSlots: Array<{ start: string; end: string }> = [];
        const durationMs = durationMinutes * 60 * 1000;

        // IMPORTANT: We work with the original time boundaries, not converted ones
        // The busy slots are already in the response timezone (UTC by default)
        const windowStart = new Date(timeMinRFC3339);
        const windowEnd = new Date(timeMaxRFC3339);

        console.log('├─ [CALCULATE_FREE_SLOTS] Time window:', {
            originalStart: timeMinRFC3339,
            originalEnd: timeMaxRFC3339,
            windowStartUTC: windowStart.toISOString(),
            windowEndUTC: windowEnd.toISOString(),
            timezone,
        });

        if (busySlots.length === 0) {
            // If no busy slots and duration fits, entire period is free
            if (windowEnd.getTime() - windowStart.getTime() >= durationMs) {
                // Return in the response timezone
                freeSlots.push({
                    start: this.formatToRFC3339(windowStart, timezone),
                    end: this.formatToRFC3339(windowEnd, timezone),
                });
            }
            return freeSlots;
        }

        // We need to find free slots ONLY within the requested window
        let checkStart = windowStart;

        for (let i = 0; i < busySlots.length; i++) {
            const busyStart = new Date(busySlots[i].start);
            const busyEnd = new Date(busySlots[i].end);

            // Skip busy slots that end before our window starts
            if (busyEnd <= windowStart) {
                continue;
            }

            // Stop if busy slot starts after our window ends
            if (busyStart >= windowEnd) {
                break;
            }

            // Check for free slot before this busy slot
            if (busyStart > checkStart) {
                const freeStart = checkStart > windowStart ? checkStart : windowStart;
                const freeEnd = busyStart < windowEnd ? busyStart : windowEnd;

                if (freeEnd.getTime() - freeStart.getTime() >= durationMs) {
                    freeSlots.push({
                        start: this.formatToRFC3339(freeStart, timezone),
                        end: this.formatToRFC3339(freeEnd, timezone),
                    });
                }
            }

            // Update check start to end of current busy slot
            checkStart = busyEnd > checkStart ? busyEnd : checkStart;
        }

        // Check for free slot after all busy slots (within window)
        if (checkStart < windowEnd && windowEnd.getTime() - checkStart.getTime() >= durationMs) {
            freeSlots.push({
                start: this.formatToRFC3339(checkStart, timezone),
                end: this.formatToRFC3339(windowEnd, timezone),
            });
        }

        console.log('├─ [CALCULATE_FREE_SLOTS] Found free slots:', freeSlots);

        return freeSlots;
    }

    /**
     * Convert a datetime string to a specific timezone
     * Handles both dateTime (with time) and date (all-day) formats
     */
    private convertToTimezone(dateTimeString: string, timezone: string): string {
        if (!dateTimeString) return '';

        // Check if it's an all-day event (date only, no time)
        if (dateTimeString.length === 10) {
            // For all-day events, just return the date as-is
            return dateTimeString;
        }

        const date = new Date(dateTimeString);

        // If the input timezone is already the target timezone, return as-is
        if (timezone === 'UTC' && dateTimeString.endsWith('Z')) {
            return dateTimeString;
        }

        // Format the date in the target timezone as RFC3339
        return formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
    }

    /**
     * Format a Date object to RFC3339 string in the specified timezone
     */
    private formatToRFC3339(date: Date, timezone: string): string {
        // Format the date in the target timezone as RFC3339
        return formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
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
                    .where(
                        and(
                            eq(calendarConnections.id, connection.id),
                            eq(calendarConnections.isActive, true),
                        ),
                    );

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
                    .where(
                        and(
                            eq(calendarConnections.id, connection.id),
                            eq(calendarConnections.isActive, true),
                        ),
                    );
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
     * Convert RecurrenceRule object to RRULE string
     */
    private convertRecurrenceRuleToString(recurrenceRule: RecurrenceRule): string {
        // Convert string values to RRule constants
        const rruleOptions: any = {
            ...recurrenceRule,
            freq: this.convertFrequencyToRRule(recurrenceRule.freq),
            wkst: recurrenceRule.wkst ? this.convertWeekdayToRRule(recurrenceRule.wkst) : undefined,
            byweekday: recurrenceRule.byweekday
                ? recurrenceRule.byweekday.map((day) => this.convertWeekdayToRRule(day))
                : undefined,
        };

        const rrule = new RRule(rruleOptions);
        return rrule.toString();
    }

    /**
     * Convert frequency string to RRule constant
     */
    private convertFrequencyToRRule(freq: string): number {
        switch (freq) {
            case 'YEARLY':
                return RRule.YEARLY;
            case 'MONTHLY':
                return RRule.MONTHLY;
            case 'WEEKLY':
                return RRule.WEEKLY;
            case 'DAILY':
                return RRule.DAILY;
            case 'HOURLY':
                return RRule.HOURLY;
            case 'MINUTELY':
                return RRule.MINUTELY;
            case 'SECONDLY':
                return RRule.SECONDLY;
            default:
                throw new Error(`Invalid frequency: ${freq}`);
        }
    }

    /**
     * Convert weekday string to RRule constant
     */
    private convertWeekdayToRRule(weekday: string): any {
        switch (weekday) {
            case 'MO':
                return RRule.MO;
            case 'TU':
                return RRule.TU;
            case 'WE':
                return RRule.WE;
            case 'TH':
                return RRule.TH;
            case 'FR':
                return RRule.FR;
            case 'SA':
                return RRule.SA;
            case 'SU':
                return RRule.SU;
            default:
                throw new Error(`Invalid weekday: ${weekday}`);
        }
    }

    /**
     * Convert RecurrenceRule array to RRULE string array
     */
    private convertRecurrenceRulesToStrings(recurrenceRules: RecurrenceRule[]): string[] {
        return recurrenceRules.map((rule) => this.convertRecurrenceRuleToString(rule));
    }

    /**
     * Parse RRULE string to RecurrenceRule object
     */
    private parseRecurrenceRuleString(rruleString: string): RecurrenceRule {
        const rrule = rrulestr(rruleString);
        const options = rrule.origOptions;

        return {
            freq: this.convertFrequencyFromRRule(options.freq!),
            dtstart: options.dtstart || undefined,
            interval: options.interval || undefined,
            wkst: options.wkst ? this.convertWeekdayFromRRule(options.wkst) : undefined,
            count: options.count || undefined,
            until: options.until || undefined,
            bysetpos: Array.isArray(options.bysetpos) ? options.bysetpos : undefined,
            bymonth: Array.isArray(options.bymonth) ? options.bymonth : undefined,
            bymonthday: Array.isArray(options.bymonthday) ? options.bymonthday : undefined,
            byyearday: Array.isArray(options.byyearday) ? options.byyearday : undefined,
            byweekno: Array.isArray(options.byweekno) ? options.byweekno : undefined,
            byweekday: Array.isArray(options.byweekday)
                ? options.byweekday.map((day) => this.convertWeekdayFromRRule(day))
                : undefined,
            byhour: Array.isArray(options.byhour) ? options.byhour : undefined,
            byminute: Array.isArray(options.byminute) ? options.byminute : undefined,
            bysecond: Array.isArray(options.bysecond) ? options.bysecond : undefined,
            byeaster: options.byeaster || undefined,
        } as RecurrenceRule;
    }

    /**
     * Convert RRule frequency constant to string
     */
    private convertFrequencyFromRRule(
        freq: number,
    ): 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'HOURLY' | 'MINUTELY' | 'SECONDLY' {
        switch (freq) {
            case RRule.YEARLY:
                return 'YEARLY';
            case RRule.MONTHLY:
                return 'MONTHLY';
            case RRule.WEEKLY:
                return 'WEEKLY';
            case RRule.DAILY:
                return 'DAILY';
            case RRule.HOURLY:
                return 'HOURLY';
            case RRule.MINUTELY:
                return 'MINUTELY';
            case RRule.SECONDLY:
                return 'SECONDLY';
            default:
                throw new Error(`Invalid frequency: ${freq}`);
        }
    }

    /**
     * Convert RRule weekday constant to string
     */
    private convertWeekdayFromRRule(weekday: any): 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU' {
        // Handle both number and Weekday object
        const weekdayNum = typeof weekday === 'number' ? weekday : weekday.weekday;

        switch (weekdayNum) {
            case RRule.MO.weekday:
                return 'MO';
            case RRule.TU.weekday:
                return 'TU';
            case RRule.WE.weekday:
                return 'WE';
            case RRule.TH.weekday:
                return 'TH';
            case RRule.FR.weekday:
                return 'FR';
            case RRule.SA.weekday:
                return 'SA';
            case RRule.SU.weekday:
                return 'SU';
            default:
                throw new Error(`Invalid weekday: ${weekday}`);
        }
    }

    /**
     * Parse RRULE string array to RecurrenceRule object array
     */
    private parseRecurrenceRuleStrings(rruleStrings: string[]): RecurrenceRule[] {
        return rruleStrings.map((rruleString) => this.parseRecurrenceRuleString(rruleString));
    }

    /**
     * Create a recurring event in the primary calendar
     */
    async createRecurringEventInPrimaryCalendar(
        event: CalendarEvent & {
            recurrence?: RecurrenceRule[];
        },
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
            conferenceDataVersion?: number;
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            const result = await this.createRecurringEvent(primaryCalendarId, event, options);
            return { ...result, calendarId: primaryCalendarId };
        } catch (error) {
            throw new Error(
                `Failed to create recurring event in primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Create a recurring event in a specific calendar
     */
    async createRecurringEvent(
        calendarId: string,
        event: CalendarEvent & {
            recurrence?: RecurrenceRule[];
        },
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

            // Convert RecurrenceRule objects to RRULE strings
            const recurrenceStrings = event.recurrence
                ? this.convertRecurrenceRulesToStrings(event.recurrence)
                : undefined;

            // Prepare the event data for Google Calendar API
            const googleEvent: calendar_v3.Schema$Event = {
                summary: event.summary,
                description: event.description,
                start: event.start,
                end: event.end,
                location: event.location,
                attendees: event.attendees?.map((attendee) => ({
                    email: attendee.email,
                    displayName: attendee.displayName,
                    responseStatus: attendee.responseStatus,
                })),
                conferenceData: event.conferenceData,
                reminders: event.reminders,
                recurrence: recurrenceStrings,
            };

            const response = await calendar.events.insert({
                calendarId,
                requestBody: googleEvent,
                sendUpdates: options?.sendUpdates,
                conferenceDataVersion: options?.conferenceDataVersion,
            });

            if (response.status !== 200 || !response.data) {
                throw new Error(`Failed to create recurring event: ${response.statusText}`);
            }

            return this.transformGoogleEvent(response.data);
        } catch (error) {
            throw new Error(
                `Failed to create recurring event: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Batch create recurring events in primary calendar
     */
    async batchCreateRecurringEventsInPrimaryCalendar(
        events: Array<CalendarEvent & { recurrence?: RecurrenceRule[] }>,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
            conferenceDataVersion?: number;
        },
    ): Promise<{
        successful: Array<{ event: CalendarEvent; result: CalendarEvent }>;
        failed: Array<{ event: CalendarEvent; error: string }>;
    }> {
        const primaryCalendarId = await this.getPrimaryCalendarId();
        const successful: Array<{ event: CalendarEvent; result: CalendarEvent }> = [];
        const failed: Array<{ event: CalendarEvent; error: string }> = [];

        for (const event of events) {
            try {
                const result = await this.createRecurringEvent(primaryCalendarId, event, options);
                successful.push({ event, result });
            } catch (error) {
                failed.push({
                    event,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return { successful, failed };
    }

    /**
     * Update a recurring event in the primary calendar
     */
    async updateRecurringEventInPrimaryCalendar(
        eventId: string,
        event: Partial<CalendarEvent> & {
            recurrence?: RecurrenceRule[];
        },
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            const result = await this.updateRecurringEvent(
                primaryCalendarId,
                eventId,
                event,
                options,
            );
            return { ...result, calendarId: primaryCalendarId };
        } catch (error) {
            throw new Error(
                `Failed to update recurring event in primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Update a recurring event in a specific calendar
     */
    async updateRecurringEvent(
        calendarId: string,
        eventId: string,
        event: Partial<CalendarEvent> & {
            recurrence?: RecurrenceRule[];
        },
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

            // Convert RecurrenceRule objects to RRULE strings
            const recurrenceStrings = event.recurrence
                ? this.convertRecurrenceRulesToStrings(event.recurrence)
                : undefined;

            // Prepare the event data for Google Calendar API
            const googleEvent: calendar_v3.Schema$Event = {
                summary: event.summary,
                description: event.description,
                start: event.start,
                end: event.end,
                location: event.location,
                attendees: event.attendees?.map((attendee) => ({
                    email: attendee.email,
                    displayName: attendee.displayName,
                    responseStatus: attendee.responseStatus,
                })),
                conferenceData: event.conferenceData,
                reminders: event.reminders,
                recurrence: recurrenceStrings,
            };

            const response = await calendar.events.patch({
                calendarId,
                eventId,
                requestBody: googleEvent,
                sendUpdates: options?.sendUpdates,
            });

            if (response.status !== 200 || !response.data) {
                throw new Error(`Failed to update recurring event: ${response.statusText}`);
            }

            return this.transformGoogleEvent(response.data);
        } catch (error) {
            throw new Error(
                `Failed to update recurring event: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Update a single instance of a recurring event
     */
    async updateRecurringEventInstance(
        calendarId: string,
        eventId: string,
        instanceStartTime: string,
        updates: Partial<CalendarEvent>,
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

            // First get the instance
            const instanceResponse = await calendar.events.get({
                calendarId,
                eventId: `${eventId}_${instanceStartTime.replace(/[:\-]/g, '')}`,
            });

            if (!instanceResponse.data) {
                throw new Error('Instance not found');
            }

            // Merge updates
            const updatedInstance = {
                ...instanceResponse.data,
                ...updates,
            };

            // Update the instance
            const response = await calendar.events.update({
                calendarId,
                eventId: instanceResponse.data.id!,
                requestBody: updatedInstance as calendar_v3.Schema$Event,
                sendUpdates: options?.sendUpdates,
            });

            return this.transformGoogleEvent(response.data);
        } catch (error) {
            throw new Error(
                `Failed to update recurring event instance: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Update all future instances of a recurring event
     */
    async updateFutureRecurringEvents(
        calendarId: string,
        eventId: string,
        fromDateTime: string,
        updates: Partial<CalendarEvent> & { recurrence?: RecurrenceRule[] },
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

            // Get the original event
            const originalEvent = await calendar.events.get({
                calendarId,
                eventId,
            });

            if (!originalEvent.data) {
                throw new Error('Event not found');
            }

            // Update the recurrence rule to end before the split point
            const originalRecurrence = originalEvent.data.recurrence || [];
            const updatedOriginalRecurrence = this.updateRecurrenceEndDate(
                originalRecurrence,
                fromDateTime,
            );

            // Update the original event with new end date
            await calendar.events.update({
                calendarId,
                eventId,
                requestBody: {
                    ...originalEvent.data,
                    recurrence: updatedOriginalRecurrence,
                },
                sendUpdates: options?.sendUpdates,
            });

            // Create a new recurring event for future instances
            const recurrenceStrings = updates.recurrence
                ? this.convertRecurrenceRulesToStrings(updates.recurrence)
                : originalRecurrence;

            const newEvent: calendar_v3.Schema$Event = {
                ...originalEvent.data,
                ...updates,
                id: undefined, // Let Google generate a new ID
                recurringEventId: undefined,
                recurrence: this.updateRecurrenceStartDate(recurrenceStrings, fromDateTime),
            };

            const response = await calendar.events.insert({
                calendarId,
                requestBody: newEvent,
                sendUpdates: options?.sendUpdates,
            });

            return this.transformGoogleEvent(response.data);
        } catch (error) {
            throw new Error(
                `Failed to update future recurring events: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Delete a recurring event from the primary calendar
     */
    async deleteRecurringEventFromPrimaryCalendar(
        eventId: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<{ calendarId: string }> {
        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            await this.deleteRecurringEvent(primaryCalendarId, eventId, options);
            return { calendarId: primaryCalendarId };
        } catch (error) {
            throw new Error(
                `Failed to delete recurring event from primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Delete a recurring event from a specific calendar
     */
    async deleteRecurringEvent(
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

            const response = await calendar.events.delete({
                calendarId,
                eventId,
                sendUpdates: options?.sendUpdates,
            });

            if (response.status !== 204) {
                throw new Error(`Failed to delete recurring event: ${response.statusText}`);
            }
        } catch (error) {
            throw new Error(
                `Failed to delete recurring event: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Delete a single instance of a recurring event
     */
    async deleteRecurringEventInstance(
        calendarId: string,
        eventId: string,
        instanceStartTime: string,
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

            // Delete the specific instance
            await calendar.events.delete({
                calendarId,
                eventId: `${eventId}_${instanceStartTime.replace(/[:\-]/g, '')}`,
                sendUpdates: options?.sendUpdates,
            });
        } catch (error) {
            throw new Error(
                `Failed to delete recurring event instance: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get a recurring event from the primary calendar
     */
    async getRecurringEventFromPrimaryCalendar(
        eventId: string,
        options?: {
            timeZone?: string;
            alwaysIncludeEmail?: boolean;
            maxAttendees?: number;
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            const result = await this.getRecurringEvent(primaryCalendarId, eventId, options);
            return { ...result, calendarId: primaryCalendarId };
        } catch (error) {
            throw new Error(
                `Failed to get recurring event from primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get a recurring event from a specific calendar
     */
    async getRecurringEvent(
        calendarId: string,
        eventId: string,
        options?: {
            timeZone?: string;
            alwaysIncludeEmail?: boolean;
            maxAttendees?: number;
        },
    ): Promise<CalendarEvent> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const response = await calendar.events.get({
                calendarId,
                eventId,
                timeZone: options?.timeZone,
                alwaysIncludeEmail: options?.alwaysIncludeEmail,
                maxAttendees: options?.maxAttendees,
            });

            if (response.status !== 200 || !response.data) {
                throw new Error(`Failed to get recurring event: ${response.statusText}`);
            }

            return this.transformGoogleEvent(response.data);
        } catch (error) {
            throw new Error(
                `Failed to get recurring event: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Reschedule a recurring event in the primary calendar
     */
    async rescheduleRecurringEventInPrimaryCalendar(
        eventId: string,
        startDateTime: string,
        endDateTime: string,
        timeZone: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        console.log('┌─ [CALENDAR_SERVICE] Rescheduling recurring event in primary calendar...', {
            eventId,
            startDateTime,
            endDateTime,
            timeZone,
            options,
        });

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            const result = await this.rescheduleRecurringEvent(
                primaryCalendarId,
                eventId,
                startDateTime,
                endDateTime,
                timeZone,
                options,
            );

            console.log(
                '└─ [CALENDAR_SERVICE] Recurring event rescheduled in primary calendar successfully',
                {
                    eventId,
                    calendarId: primaryCalendarId,
                },
            );

            return { ...result, calendarId: primaryCalendarId };
        } catch (error) {
            console.error(
                '└─ [CALENDAR_SERVICE] Error rescheduling recurring event in primary calendar:',
                error,
            );
            throw new Error(
                `Failed to reschedule recurring event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Reschedule a recurring event in a specific calendar
     */
    async rescheduleRecurringEvent(
        calendarId: string,
        eventId: string,
        startDateTime: string,
        endDateTime: string,
        timeZone: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent> {
        console.log('┌─ [CALENDAR_SERVICE] Rescheduling recurring event in specific calendar...', {
            calendarId,
            eventId,
            startDateTime,
            endDateTime,
            timeZone,
            options,
        });

        try {
            const { connection, account: accountData } =
                await this.getCalendarConnection(calendarId);

            if (!accountData) {
                throw new Error(`No account found for calendar ${calendarId}`);
            }

            const calendar = await this.getCalendarApi(accountData.id);

            // First, get the current event to preserve its properties
            const currentEventResponse = await calendar.events.get({
                calendarId: calendarId,
                eventId: eventId,
            });

            if (!currentEventResponse.data) {
                throw new Error('No event data received from Google Calendar API');
            }

            const currentEvent = currentEventResponse.data;

            // Update the event with new start and end times
            const updatedEvent: calendar_v3.Schema$Event = {
                ...currentEvent,
                start: {
                    dateTime: startDateTime,
                    timeZone: timeZone,
                },
                end: {
                    dateTime: endDateTime,
                    timeZone: timeZone,
                },
            };

            // Update the event
            const response = await calendar.events.update({
                calendarId: calendarId,
                eventId: eventId,
                requestBody: updatedEvent,
                sendUpdates: options?.sendUpdates,
            });

            if (!response.data) {
                throw new Error('No event data received from Google Calendar API after update');
            }

            const transformedEvent = this.transformGoogleEvent(response.data);

            console.log('└─ [CALENDAR_SERVICE] Recurring event rescheduled successfully', {
                eventId,
                calendarId,
            });

            return transformedEvent;
        } catch (error) {
            console.error(
                '└─ [CALENDAR_SERVICE] Error rescheduling recurring event in specific calendar:',
                error,
            );
            throw new Error(
                `Failed to reschedule recurring event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Transform Google Calendar event to our interface
     */
    private transformGoogleEvent(
        googleEvent: calendar_v3.Schema$Event,
        requestedTimezone?: string,
    ): RecurringCalendarEvent {
        const base = {
            id: googleEvent.id || undefined,
            summary: googleEvent.summary || '',
            description: googleEvent.description || undefined,
            start: {
                dateTime: googleEvent.start?.dateTime || undefined,
                date: googleEvent.start?.date || undefined,
                timeZone: googleEvent.start?.timeZone || requestedTimezone || undefined,
            },
            end: {
                dateTime: googleEvent.end?.dateTime || undefined,
                date: googleEvent.end?.date || undefined,
                timeZone: googleEvent.end?.timeZone || requestedTimezone || undefined,
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

        // Add recurrence-specific fields
        const recurrenceFields: Partial<RecurringCalendarEvent> = {
            recurringEventId: googleEvent.recurringEventId || undefined,
            originalStartTime: googleEvent.originalStartTime
                ? {
                      dateTime: googleEvent.originalStartTime.dateTime || undefined,
                      date: googleEvent.originalStartTime.date || undefined,
                      timeZone: googleEvent.originalStartTime.timeZone || undefined,
                  }
                : undefined,
            recurrence: this.parseEventRecurrence(googleEvent),
        };

        return { ...base, ...recurrenceFields };
    }

    /**
     * Parse recurrence rules from Google event
     */
    private parseEventRecurrence(
        googleEvent: calendar_v3.Schema$Event,
    ): RecurrenceRule[] | undefined {
        if (!googleEvent.recurrence || googleEvent.recurrence.length === 0) {
            return undefined;
        }

        return googleEvent.recurrence
            .filter((rule) => rule.startsWith('RRULE:'))
            .map((rule) => this.parseRecurrenceRuleString(rule));
    }

    /**
     * Update recurrence rule to start from a specific date
     */
    private updateRecurrenceStartDate(recurrence: string[], fromDate: string): string[] {
        return recurrence.map((rule) => {
            if (rule.startsWith('RRULE:')) {
                const rrule = rrulestr(rule);
                const options = rrule.origOptions;

                // Set DTSTART to the new start date
                options.dtstart = new Date(fromDate);

                const newRRule = new RRule(options);
                return newRRule.toString();
            }
            return rule;
        });
    }

    /**
     * Update recurrence rule to end before a specific date
     */
    private updateRecurrenceEndDate(recurrence: string[], beforeDate: string): string[] {
        return recurrence.map((rule) => {
            if (rule.startsWith('RRULE:')) {
                const rrule = rrulestr(rule);
                const options = rrule.origOptions;

                // Set UNTIL to one day before the split date
                const until = new Date(beforeDate);
                until.setDate(until.getDate() - 1);

                options.until = until;

                const newRRule = new RRule(options);
                return newRRule.toString();
            }
            return rule;
        });
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
