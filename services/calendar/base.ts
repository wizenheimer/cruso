import { google, calendar_v3 } from 'googleapis';
import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { account } from '@/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { GoogleAuthManager } from './manager';
import type { CalendarEvent } from '@/types/services';

// ==================================================
// Base Calendar Service Class
// ==================================================

export abstract class BaseCalendarService {
    protected userId: string;
    protected authManager: GoogleAuthManager;
    protected calendarCache: Map<string, calendar_v3.Calendar> = new Map();

    constructor(userId: string) {
        console.log('┌─ [BASE_CALENDAR_SERVICE] Initializing base service...', { userId });
        this.userId = userId;
        this.authManager = new GoogleAuthManager();
        console.log('└─ [BASE_CALENDAR_SERVICE] Base service initialized');
    }

    /**
     * Get calendar API instance for a specific account
     */
    protected async getCalendarApi(accountId: string): Promise<calendar_v3.Calendar> {
        console.log('┌─ [BASE_CALENDAR_SERVICE] Getting calendar API instance...', { accountId });

        // Check cache first
        if (this.calendarCache.has(accountId)) {
            console.log('└─ [BASE_CALENDAR_SERVICE] Using cached calendar API instance');
            return this.calendarCache.get(accountId)!;
        }

        console.log('├─ [BASE_CALENDAR_SERVICE] Creating new calendar API instance...');
        const authClient = await this.authManager.getAuthenticatedClient(accountId);
        const calendar = google.calendar({ version: 'v3', auth: authClient });

        // Cache the instance
        this.calendarCache.set(accountId, calendar);
        console.log('└─ [BASE_CALENDAR_SERVICE] Calendar API instance created and cached');

        return calendar;
    }

    /**
     * Get active calendar connections for the user
     */
    protected async getActiveConnections() {
        console.log('┌─ [BASE_CALENDAR_SERVICE] Getting active connections...', {
            userId: this.userId,
        });

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

        console.log('└─ [BASE_CALENDAR_SERVICE] Found connections:', { count: connections.length });
        return connections;
    }

    /**
     * Get calendar connection data for a specific calendar
     */
    protected async getCalendarConnection(calendarId: string) {
        console.log('┌─ [BASE_CALENDAR_SERVICE] Getting calendar connection...', { calendarId });

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

        console.log('└─ [BASE_CALENDAR_SERVICE] Calendar connection found');
        return connection[0];
    }

    /**
     * Get primary calendar ID for the user
     */
    protected async getPrimaryCalendarId(): Promise<string> {
        console.log('┌─ [BASE_CALENDAR_SERVICE] Getting primary calendar ID...', {
            userId: this.userId,
        });

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

        console.log(
            '└─ [BASE_CALENDAR_SERVICE] Primary calendar ID:',
            primaryConnection[0].calendarId,
        );
        return primaryConnection[0].calendarId;
    }

    /**
     * Transform Google Calendar API event to our CalendarEvent interface
     */
    protected transformGoogleEvent(
        googleEvent: calendar_v3.Schema$Event,
        requestedTimezone?: string,
    ): CalendarEvent {
        return {
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
                responseStatus: (attendee.responseStatus as any) || undefined,
                optional: attendee.optional || undefined,
                resource: attendee.resource || undefined,
                organizer: attendee.organizer || undefined,
                self: attendee.self || undefined,
                comment: attendee.comment || undefined,
                additionalGuests: attendee.additionalGuests || undefined,
            })),
            location: googleEvent.location || undefined,
            conferenceData: googleEvent.conferenceData || undefined,
            reminders: googleEvent.reminders
                ? {
                      useDefault: googleEvent.reminders.useDefault || undefined,
                      overrides: googleEvent.reminders.overrides?.map((override) => ({
                          method: (override.method as any) || 'email',
                          minutes: override.minutes || 0,
                      })),
                  }
                : undefined,
            recurringEventId: googleEvent.recurringEventId || undefined,
            originalStartTime: googleEvent.originalStartTime
                ? {
                      dateTime: googleEvent.originalStartTime.dateTime || undefined,
                      date: googleEvent.originalStartTime.date || undefined,
                      timeZone: googleEvent.originalStartTime.timeZone || undefined,
                  }
                : undefined,
            created: googleEvent.created || undefined,
            updated: googleEvent.updated || undefined,
            status: (googleEvent.status as any) || undefined,
            organizer: googleEvent.organizer
                ? {
                      email: googleEvent.organizer.email || undefined,
                      displayName: googleEvent.organizer.displayName || undefined,
                      self: googleEvent.organizer.self || undefined,
                  }
                : undefined,
            creator: googleEvent.creator
                ? {
                      email: googleEvent.creator.email || undefined,
                      displayName: googleEvent.creator.displayName || undefined,
                      self: googleEvent.creator.self || undefined,
                  }
                : undefined,
            htmlLink: googleEvent.htmlLink || undefined,
            transparency: (googleEvent.transparency as any) || undefined,
            visibility: (googleEvent.visibility as any) || undefined,
            iCalUID: googleEvent.iCalUID || undefined,
            sequence: googleEvent.sequence || undefined,
            colorId: googleEvent.colorId || undefined,
            recurrence: googleEvent.recurrence || undefined,
            extendedProperties: googleEvent.extendedProperties || undefined,
            hangoutLink: googleEvent.hangoutLink || undefined,
            anyoneCanAddSelf: googleEvent.anyoneCanAddSelf || undefined,
            guestsCanInviteOthers: googleEvent.guestsCanInviteOthers || undefined,
            guestsCanModify: googleEvent.guestsCanModify || undefined,
            guestsCanSeeOtherGuests: googleEvent.guestsCanSeeOtherGuests || undefined,
            privateCopy: googleEvent.privateCopy || undefined,
            locked: googleEvent.locked || undefined,
            source: googleEvent.source || undefined,
            attachments: googleEvent.attachments || undefined,
        };
    }

    /**
     * Convert timezone-aware date to RFC3339 format
     */
    protected formatToRFC3339(date: Date, timezone: string): string {
        return date.toISOString();
    }

    /**
     * Convert date string to different timezone
     */
    protected convertToTimezone(dateTimeString: string, timezone: string): string {
        const date = new Date(dateTimeString);
        return date.toISOString();
    }
}
