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

    protected convertLocalTimeToUTC(
        year: number,
        month: number,
        day: number,
        hour: number,
        minute: number,
        second: number,
        timezone: string,
    ): Date {
        // Create a date that we'll use to find the correct UTC time
        // Start with the assumption that it's in UTC
        let testDate = new Date(Date.UTC(year, month, day, hour, minute, second));

        // Get what this UTC time looks like in the target timezone
        const options: Intl.DateTimeFormatOptions = {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        };

        // Format the test date in the target timezone
        const formatter = new Intl.DateTimeFormat('sv-SE', options);
        const formattedInTargetTZ = formatter.format(testDate);

        // Parse the formatted result to see what time it shows
        const [datePart, timePart] = formattedInTargetTZ.split(' ');
        const [targetYear, targetMonth, targetDay] = datePart.split('-').map(Number);
        const [targetHour, targetMinute, targetSecond] = timePart.split(':').map(Number);

        // Calculate the difference between what we want and what we got
        const wantedTime = new Date(year, month, day, hour, minute, second).getTime();
        const actualTime = new Date(
            targetYear,
            targetMonth - 1,
            targetDay,
            targetHour,
            targetMinute,
            targetSecond,
        ).getTime();
        const offsetMs = wantedTime - actualTime;

        // Adjust the UTC time by the offset
        return new Date(testDate.getTime() + offsetMs);
    }

    protected convertToRFC3339(datetime: string, fallbackTimezone: string): string {
        if (this.hasTimezoneInDatetime(datetime)) {
            // Already has timezone, use as-is
            return datetime;
        } else {
            // Timezone-naive, interpret as local time in fallbackTimezone and convert to UTC
            try {
                // Parse the datetime components
                const match = datetime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
                if (!match) {
                    throw new Error('Invalid datetime format');
                }

                const [, year, month, day, hour, minute, second] = match.map(Number);

                // Create a temporary date in UTC to get the baseline
                const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

                // Find what UTC time corresponds to the desired local time in the target timezone
                // We do this by binary search approach or by using the timezone offset
                const targetDate = this.convertLocalTimeToUTC(
                    year,
                    month - 1,
                    day,
                    hour,
                    minute,
                    second,
                    fallbackTimezone,
                );

                return targetDate.toISOString().replace(/\.000Z$/, 'Z');
            } catch (error) {
                // Fallback: if timezone conversion fails, append Z for UTC
                return datetime + 'Z';
            }
        }
    }

    protected createTimeObject(
        datetime: string,
        fallbackTimezone: string,
    ): { dateTime: string; timeZone?: string } {
        if (this.hasTimezoneInDatetime(datetime)) {
            // Timezone included in datetime - use as-is, no separate timeZone property needed
            return { dateTime: datetime };
        } else {
            // Timezone-naive datetime - use fallback timezone
            return { dateTime: datetime, timeZone: fallbackTimezone };
        }
    }

    private hasTimezoneInDatetime(datetime: string): boolean {
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/.test(datetime);
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

        // Format start and end times with timezone
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
                const endDate = event.end?.date ? new Date(event.end.date) : null;
                if (endDate) {
                    endDate.setDate(endDate.getDate() - 1); // Subtract 1 day since end is exclusive
                    const adjustedEndTime = endDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    });
                    timeInfo = `\nStart Date: ${startTime}\nEnd Date: ${adjustedEndTime}`;
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
     * Formats a date/time with timezone abbreviation
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

            const parsedDate = new Date(dt);
            if (isNaN(parsedDate.getTime())) return dt;

            // If it's a date-only event, just return the date
            if (date && !dateTime) {
                return parsedDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                });
            }

            // For timed events, include timezone
            const options: Intl.DateTimeFormatOptions = {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                timeZoneName: 'short',
            };

            if (timeZone) {
                options.timeZone = timeZone;
            }

            return parsedDate.toLocaleString('en-US', options);
        } catch (error) {
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
}
