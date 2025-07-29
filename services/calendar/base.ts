import { GoogleAuthManager } from './auth';
import { calendar_v3 } from 'googleapis';
import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { account } from '@/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { google } from 'googleapis';
import { DateTime } from 'luxon';

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
        const calendar = google.calendar({ version: 'v3', auth: authClient, timeout: 3000 });

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

    protected async getCalendarDefaultTimezone(
        calendarId: string,
        calendar: calendar_v3.Calendar,
    ): Promise<string> {
        try {
            const response = await calendar.calendarList.get({ calendarId });
            return response.data?.timeZone ?? 'UTC';
        } catch (error) {
            throw new Error(`Failed to get calendar default timezone: ${error}`);
        }
    }

    /**
     * Convert datetime string to RFC3339 format using Luxon
     * No regex - relies on Luxon's robust parsing
     */
    protected convertToRFC3339(datetime: string, fallbackTimezone: string): string {
        try {
            // Parse with Luxon first
            const dt = DateTime.fromISO(datetime);

            if (!dt.isValid) {
                throw new Error(`Invalid datetime format: ${dt.invalidReason}`);
            }

            // Check if it already has timezone info
            if (this.hasTimezoneInfoLuxon(dt)) {
                // Already has timezone info, convert to UTC
                return dt.toUTC().toISO({ suppressMilliseconds: true }) || datetime;
            }

            // Timezone-naive datetime - interpret in fallback timezone and convert to UTC
            const dtWithTz = DateTime.fromISO(datetime, { zone: fallbackTimezone });

            if (!dtWithTz.isValid) {
                throw new Error(`Invalid datetime or timezone: ${dtWithTz.invalidReason}`);
            }

            return dtWithTz.toUTC().toISO({ suppressMilliseconds: true }) || `${datetime}Z`;
        } catch (error) {
            console.error('Error converting datetime to RFC3339:', error);
            // Fallback: append Z for UTC (safer than throwing)
            return `${datetime}Z`;
        }
    }

    /**
     * Create time object for Google Calendar API
     * Uses the more reliable approach of keeping timezone info separate
     */
    protected createTimeObject(
        datetime: string,
        fallbackTimezone: string,
    ): { dateTime: string; timeZone?: string } {
        try {
            const dt = DateTime.fromISO(datetime);

            if (!dt.isValid) {
                console.error(`Invalid datetime format: ${dt.invalidReason}`);
                // Return with fallback timezone
                return { dateTime: datetime, timeZone: fallbackTimezone };
            }

            if (this.hasTimezoneInfoLuxon(dt)) {
                // Timezone included in datetime - use as-is
                return { dateTime: dt.toISO({ suppressMilliseconds: true }) || datetime };
            }

            // For timezone-naive datetime, send with timezone info
            // This is more reliable than converting to UTC
            const dtWithTz = DateTime.fromISO(datetime, { zone: fallbackTimezone });
            if (!dtWithTz.isValid) {
                console.error(`Invalid datetime with timezone: ${dtWithTz.invalidReason}`);
                // Fallback to UTC conversion
                return { dateTime: this.convertToRFC3339(datetime, fallbackTimezone) };
            }

            return {
                dateTime: datetime,
                timeZone: fallbackTimezone,
            };
        } catch (error) {
            console.error('Error creating time object:', error);
            // Fallback to UTC conversion
            return { dateTime: this.convertToRFC3339(datetime, fallbackTimezone) };
        }
    }

    /**
     * Check if DateTime has timezone information using Luxon properties
     * Replaces regex-based timezone detection
     */
    protected hasTimezoneInfoLuxon(dt: DateTime): boolean {
        // Check if the DateTime has explicit timezone info
        // If zone is not 'local' and not 'invalid', it has timezone info
        return dt.zone.type !== 'local' && dt.zone.type !== 'invalid';
    }

    /**
     * Detects if an event is recurring or single
     */
    protected async detectEventType(
        eventId: string,
        calendarId: string,
        calendar: calendar_v3.Calendar,
    ): Promise<'recurring' | 'single'> {
        const response = await calendar.events.get({
            calendarId,
            eventId,
        });

        const event = response.data;
        return event.recurrence && event.recurrence.length > 0 ? 'recurring' : 'single';
    }

    /**
     * Formats a single event with rich details
     */
    protected formatEventWithDetails(event: calendar_v3.Schema$Event, calendarId?: string): string {
        const title = event.summary ? `Event: ${event.summary}` : 'Untitled Event';
        const eventId = event.id ? `\nEvent ID: ${event.id}` : '';
        const description = event.description ? `\nDescription: ${event.description}` : '';
        const location = event.location ? `\nLocation: ${event.location}` : '';

        // Format start and end times with timezone using Luxon
        const startTime = this.formatDateTime(
            event.start?.dateTime,
            event.start?.date,
            event.start?.timeZone || undefined,
        );
        const endTime = this.formatDateTime(
            event.end?.dateTime,
            event.end?.date,
            event.end?.timeZone || undefined,
        );

        let timeInfo: string;
        if (event.start?.date) {
            // All-day event
            if (event.start.date === event.end?.date) {
                // Single day all-day event
                timeInfo = `\nDate: ${startTime}`;
            } else {
                // Multi-day all-day event - end date is exclusive, so subtract 1 day for display
                const endDate = event.end?.date;
                if (endDate) {
                    try {
                        const endDateTime = DateTime.fromISO(endDate).minus({ days: 1 });
                        const adjustedEndTime = endDateTime.toLocaleString(DateTime.DATE_FULL);
                        timeInfo = `\nStart Date: ${startTime}\nEnd Date: ${adjustedEndTime}`;
                    } catch (error) {
                        console.error('Error formatting end date:', error);
                        timeInfo = `\nStart Date: ${startTime}`;
                    }
                } else {
                    timeInfo = `\nStart Date: ${startTime}`;
                }
            }
        } else {
            // Timed event
            timeInfo = `\nStart: ${startTime}\nEnd: ${endTime}`;
        }

        const attendeeInfo = this.formatAttendees(event.attendees);
        const eventUrl = this.getEventUrl(event, calendarId);
        const urlInfo = eventUrl ? `\nView: ${eventUrl}` : '';

        return `${title}${eventId}${description}${timeInfo}${location}${attendeeInfo}${urlInfo}`;
    }

    /**
     * Formats a date/time for AI agent consumption
     * Returns ISO format with timezone info for clarity
     */
    private formatDateTime(
        dateTime?: string | null,
        date?: string | null,
        timeZone?: string,
    ): string {
        if (!dateTime && !date) return 'unspecified';

        try {
            const dt = dateTime || date;
            if (!dt) return 'unspecified';

            // If it's a date-only event, format as ISO date
            if (date && !dateTime) {
                const luxonDate = DateTime.fromISO(date);
                if (!luxonDate.isValid) {
                    console.error(`Invalid date: ${luxonDate.invalidReason}`);
                    return dt;
                }
                // Return ISO date format for AI clarity
                return luxonDate.toISODate() || dt;
            }

            // For timed events, return ISO format with timezone info
            let luxonDateTime: DateTime;

            if (timeZone) {
                // Parse and convert to specified timezone
                luxonDateTime = DateTime.fromISO(dt, { zone: timeZone });
            } else {
                // Parse with whatever timezone info is in the string
                luxonDateTime = DateTime.fromISO(dt);
            }

            if (!luxonDateTime.isValid) {
                console.error(`Invalid datetime: ${luxonDateTime.invalidReason}`);
                return dt;
            }

            // Return ISO format with timezone info for AI agent clarity
            // This is unambiguous and easily parseable
            return luxonDateTime.toISO({ suppressMilliseconds: true }) || dt;
        } catch (error) {
            console.error('Error formatting datetime:', error);
            return dateTime || date || 'unspecified';
        }
    }

    /**
     * Formats attendees with their response status
     */
    private formatAttendees(attendees?: calendar_v3.Schema$EventAttendee[]): string {
        if (!attendees || attendees.length === 0) return '';

        const formatted = attendees
            .map((attendee) => {
                const email = attendee.email || 'unknown';
                const name = attendee.displayName || email;
                const status = attendee.responseStatus || 'unknown';

                const statusText =
                    {
                        accepted: 'accepted',
                        declined: 'declined',
                        tentative: 'tentative',
                        needsAction: 'pending',
                    }[status] || 'unknown';

                return `${name} (${statusText})`;
            })
            .join(', ');

        return `\nGuests: ${formatted}`;
    }

    private getEventUrl(event: calendar_v3.Schema$Event, calendarId?: string): string | null {
        if (event.htmlLink) {
            return event.htmlLink;
        } else if (calendarId && event.id) {
            return this.generateEventUrl(calendarId, event.id);
        }
        return null;
    }

    private generateEventUrl(calendarId: string, eventId: string): string {
        const encodedCalendarId = encodeURIComponent(calendarId);
        const encodedEventId = encodeURIComponent(eventId);
        return `https://calendar.google.com/calendar/event?eid=${encodedEventId}&cid=${encodedCalendarId}`;
    }

    /**
     * Utility method to validate timezone strings
     */
    protected isValidTimezone(timezone: string): boolean {
        try {
            const dt = DateTime.now().setZone(timezone);
            return dt.isValid;
        } catch {
            return false;
        }
    }

    /**
     * Utility method to get current time in a specific timezone
     */
    protected getCurrentTimeInTimezone(timezone: string): string {
        try {
            const dt = DateTime.now().setZone(timezone);
            if (!dt.isValid) {
                throw new Error(`Invalid timezone: ${timezone}`);
            }
            return dt.toISO({ suppressMilliseconds: true }) || dt.toString();
        } catch (error) {
            console.error('Error getting current time in timezone:', error);
            return DateTime.utc().toISO({ suppressMilliseconds: true }) || new Date().toISOString();
        }
    }
}
