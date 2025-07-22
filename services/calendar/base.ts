import { google, calendar_v3 } from 'googleapis';
import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { account } from '@/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { GoogleAuthManager } from './manager';
import { RRule, rrulestr, Frequency } from 'rrule';
import type {
    RecurrenceRule,
    CalendarEvent,
    CalendarInfo,
    TimeRange,
    Frequency as FrequencyType,
    Weekday,
} from '@/types/services';

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

    // ==================================================
    // RRULE Helper Methods
    // ==================================================

    /**
     * Convert RecurrenceRule objects to RRULE strings
     */
    protected convertRecurrenceRulesToStrings(recurrenceRules: RecurrenceRule[]): string[] {
        return recurrenceRules.map((rule) => this.convertRecurrenceRuleToString(rule));
    }

    /**
     * Convert a single RecurrenceRule object to RRULE string
     */
    protected convertRecurrenceRuleToString(recurrenceRule: RecurrenceRule): string {
        const options: Record<string, unknown> = {
            freq: this.convertFrequencyToRRule(recurrenceRule.freq),
            dtstart: recurrenceRule.dtstart,
            interval: recurrenceRule.interval,
            wkst: recurrenceRule.wkst ? this.convertWeekdayToRRule(recurrenceRule.wkst) : undefined,
            count: recurrenceRule.count,
            until: recurrenceRule.until,
            bysetpos: recurrenceRule.bysetpos,
            bymonth: recurrenceRule.bymonth,
            bymonthday: recurrenceRule.bymonthday,
            byyearday: recurrenceRule.byyearday,
            byweekno: recurrenceRule.byweekno,
            byweekday: recurrenceRule.byweekday?.map((day) => this.convertWeekdayToRRule(day)),
            byhour: recurrenceRule.byhour,
            byminute: recurrenceRule.byminute,
            bysecond: recurrenceRule.bysecond,
            byeaster: recurrenceRule.byeaster,
        };

        // Remove undefined values
        Object.keys(options).forEach((key) => {
            if (options[key] === undefined) {
                delete options[key];
            }
        });

        const rrule = new RRule(options);
        return rrule.toString();
    }

    /**
     * Parse RRULE strings to RecurrenceRule objects
     */
    protected parseRecurrenceRuleStrings(rruleStrings: string[]): RecurrenceRule[] {
        return rruleStrings.map((rruleString) => this.parseRecurrenceRuleString(rruleString));
    }

    /**
     * Parse a single RRULE string to RecurrenceRule object
     */
    protected parseRecurrenceRuleString(rruleString: string): RecurrenceRule {
        const rrule = rrulestr(rruleString);
        const options = rrule.origOptions;

        return {
            freq: this.convertFrequencyFromRRule(options.freq || Frequency.DAILY),
            dtstart: options.dtstart || undefined,
            interval: options.interval || undefined,
            wkst: options.wkst ? this.convertWeekdayFromRRule(options.wkst as number) : undefined,
            count: options.count || undefined,
            until: options.until || undefined,
            bysetpos: Array.isArray(options.bysetpos)
                ? options.bysetpos
                : options.bysetpos
                  ? [options.bysetpos]
                  : undefined,
            bymonth: Array.isArray(options.bymonth)
                ? options.bymonth
                : options.bymonth
                  ? [options.bymonth]
                  : undefined,
            bymonthday: Array.isArray(options.bymonthday)
                ? options.bymonthday
                : options.bymonthday
                  ? [options.bymonthday]
                  : undefined,
            byyearday: Array.isArray(options.byyearday)
                ? options.byyearday
                : options.byyearday
                  ? [options.byyearday]
                  : undefined,
            byweekno: Array.isArray(options.byweekno)
                ? options.byweekno
                : options.byweekno
                  ? [options.byweekno]
                  : undefined,
            byweekday: Array.isArray(options.byweekday)
                ? options.byweekday.map((day) => this.convertWeekdayFromRRule(day as number))
                : options.byweekday
                  ? [this.convertWeekdayFromRRule(options.byweekday as number)]
                  : undefined,
            byhour: Array.isArray(options.byhour)
                ? options.byhour
                : options.byhour
                  ? [options.byhour]
                  : undefined,
            byminute: Array.isArray(options.byminute)
                ? options.byminute
                : options.byminute
                  ? [options.byminute]
                  : undefined,
            bysecond: Array.isArray(options.bysecond)
                ? options.bysecond
                : options.bysecond
                  ? [options.bysecond]
                  : undefined,
            byeaster: options.byeaster || undefined,
        };
    }

    /**
     * Convert frequency string to RRULE frequency number
     */
    private convertFrequencyToRRule(freq: FrequencyType): number {
        switch (freq) {
            case 'YEARLY':
                return Frequency.YEARLY;
            case 'MONTHLY':
                return Frequency.MONTHLY;
            case 'WEEKLY':
                return Frequency.WEEKLY;
            case 'DAILY':
                return Frequency.DAILY;
            case 'HOURLY':
                return Frequency.HOURLY;
            case 'MINUTELY':
                return Frequency.MINUTELY;
            case 'SECONDLY':
                return Frequency.SECONDLY;
            default:
                return Frequency.DAILY;
        }
    }

    /**
     * Convert RRULE frequency number to frequency string
     */
    private convertFrequencyFromRRule(freq: number): FrequencyType {
        switch (freq) {
            case Frequency.YEARLY:
                return 'YEARLY';
            case Frequency.MONTHLY:
                return 'MONTHLY';
            case Frequency.WEEKLY:
                return 'WEEKLY';
            case Frequency.DAILY:
                return 'DAILY';
            case Frequency.HOURLY:
                return 'HOURLY';
            case Frequency.MINUTELY:
                return 'MINUTELY';
            case Frequency.SECONDLY:
                return 'SECONDLY';
            default:
                return 'DAILY';
        }
    }

    /**
     * Convert weekday string to RRULE weekday number
     */
    private convertWeekdayToRRule(weekday: Weekday): number {
        switch (weekday) {
            case 'MO':
                return 0; // Monday
            case 'TU':
                return 1; // Tuesday
            case 'WE':
                return 2; // Wednesday
            case 'TH':
                return 3; // Thursday
            case 'FR':
                return 4; // Friday
            case 'SA':
                return 5; // Saturday
            case 'SU':
                return 6; // Sunday
            default:
                return 0; // Monday
        }
    }

    /**
     * Convert RRULE weekday number to weekday string
     */
    private convertWeekdayFromRRule(weekday: number): Weekday {
        switch (weekday) {
            case 0:
                return 'MO';
            case 1:
                return 'TU';
            case 2:
                return 'WE';
            case 3:
                return 'TH';
            case 4:
                return 'FR';
            case 5:
                return 'SA';
            case 6:
                return 'SU';
            default:
                return 'MO';
        }
    }

    /**
     * Validate RRULE string format
     */
    protected validateRRuleString(rruleString: string): boolean {
        try {
            rrulestr(rruleString);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate RecurrenceRule object
     */
    protected validateRecurrenceRule(rule: RecurrenceRule): boolean {
        if (!rule.freq) {
            return false;
        }

        // The Zod schema already validates the frequency, so we can trust it
        // Just validate weekday values if present
        if (rule.byweekday) {
            const validWeekdays: Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
            for (const day of rule.byweekday) {
                if (!validWeekdays.includes(day)) {
                    return false;
                }
            }
        }

        return true;
    }
}
