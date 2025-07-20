import { RRule, rrulestr, Frequency } from 'rrule';

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
// RRULE Conversion Helpers
// ==================================================

/**
 * Convert RecurrenceRule objects to RRULE strings
 */
export function convertRecurrenceRulesToStrings(recurrenceRules: RecurrenceRule[]): string[] {
    return recurrenceRules.map((rule) => convertRecurrenceRuleToString(rule));
}

/**
 * Convert a single RecurrenceRule object to RRULE string
 */
export function convertRecurrenceRuleToString(recurrenceRule: RecurrenceRule): string {
    const options: Record<string, unknown> = {
        freq: convertFrequencyToRRule(recurrenceRule.freq),
        dtstart: recurrenceRule.dtstart,
        interval: recurrenceRule.interval,
        wkst: recurrenceRule.wkst ? convertWeekdayToRRule(recurrenceRule.wkst) : undefined,
        count: recurrenceRule.count,
        until: recurrenceRule.until,
        bysetpos: recurrenceRule.bysetpos,
        bymonth: recurrenceRule.bymonth,
        bymonthday: recurrenceRule.bymonthday,
        byyearday: recurrenceRule.byyearday,
        byweekno: recurrenceRule.byweekno,
        byweekday: recurrenceRule.byweekday?.map((day) => convertWeekdayToRRule(day)),
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
export function parseRecurrenceRuleStrings(rruleStrings: string[]): RecurrenceRule[] {
    return rruleStrings.map((rruleString) => parseRecurrenceRuleString(rruleString));
}

/**
 * Parse a single RRULE string to RecurrenceRule object
 */
export function parseRecurrenceRuleString(rruleString: string): RecurrenceRule {
    const rrule = rrulestr(rruleString);
    const options = rrule.origOptions;

    return {
        freq: convertFrequencyFromRRule(options.freq || Frequency.DAILY),
        dtstart: options.dtstart || undefined,
        interval: options.interval || undefined,
        wkst: options.wkst ? convertWeekdayFromRRule(options.wkst as number) : undefined,
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
            ? options.byweekday.map((day) => convertWeekdayFromRRule(day as number))
            : options.byweekday
              ? [convertWeekdayFromRRule(options.byweekday as number)]
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

// ==================================================
// Frequency Conversion Helpers
// ==================================================

/**
 * Convert frequency string to RRULE frequency number
 */
function convertFrequencyToRRule(freq: string): number {
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
function convertFrequencyFromRRule(
    freq: number,
): 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'HOURLY' | 'MINUTELY' | 'SECONDLY' {
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

// ==================================================
// Weekday Conversion Helpers
// ==================================================

/**
 * Convert weekday string to RRULE weekday number
 */
function convertWeekdayToRRule(weekday: string): number {
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
function convertWeekdayFromRRule(weekday: number): 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU' {
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

// ==================================================
// Validation Helpers
// ==================================================

/**
 * Validate RRULE string format
 */
export function validateRRuleString(rruleString: string): boolean {
    try {
        rrulestr(rruleString);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate RecurrenceRule object
 */
export function validateRecurrenceRule(rule: RecurrenceRule): boolean {
    if (!rule.freq) {
        return false;
    }

    const validFreqs = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'HOURLY', 'MINUTELY', 'SECONDLY'];
    if (!validFreqs.includes(rule.freq)) {
        return false;
    }

    // Validate weekday values if present
    if (rule.byweekday) {
        const validWeekdays = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
        for (const day of rule.byweekday) {
            if (!validWeekdays.includes(day)) {
                return false;
            }
        }
    }

    return true;
}

// ==================================================
// Common Recurrence Patterns
// ==================================================

/**
 * Create a daily recurrence rule
 */
export function createDailyRecurrence(options?: {
    interval?: number;
    count?: number;
    until?: Date;
}): RecurrenceRule {
    return {
        freq: 'DAILY',
        interval: options?.interval,
        count: options?.count,
        until: options?.until,
    };
}

/**
 * Create a weekly recurrence rule
 */
export function createWeeklyRecurrence(options?: {
    interval?: number;
    byweekday?: ('MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU')[];
    count?: number;
    until?: Date;
}): RecurrenceRule {
    return {
        freq: 'WEEKLY',
        interval: options?.interval,
        byweekday: options?.byweekday,
        count: options?.count,
        until: options?.until,
    };
}

/**
 * Create a monthly recurrence rule
 */
export function createMonthlyRecurrence(options?: {
    interval?: number;
    bymonthday?: number[];
    byweekday?: ('MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU')[];
    bysetpos?: number[];
    count?: number;
    until?: Date;
}): RecurrenceRule {
    return {
        freq: 'MONTHLY',
        interval: options?.interval,
        bymonthday: options?.bymonthday,
        byweekday: options?.byweekday,
        bysetpos: options?.bysetpos,
        count: options?.count,
        until: options?.until,
    };
}

/**
 * Create a yearly recurrence rule
 */
export function createYearlyRecurrence(options?: {
    interval?: number;
    bymonth?: number[];
    bymonthday?: number[];
    count?: number;
    until?: Date;
}): RecurrenceRule {
    return {
        freq: 'YEARLY',
        interval: options?.interval,
        bymonth: options?.bymonth,
        bymonthday: options?.bymonthday,
        count: options?.count,
        until: options?.until,
    };
}

// ==================================================
// Utility Functions
// ==================================================

/**
 * Get the next occurrence date from a recurrence rule
 */
export function getNextOccurrence(recurrenceRule: RecurrenceRule, fromDate?: Date): Date | null {
    try {
        const rruleString = convertRecurrenceRuleToString(recurrenceRule);
        const rrule = rrulestr(rruleString);
        const next = rrule.after(fromDate || new Date());
        return next;
    } catch {
        return null;
    }
}

/**
 * Get all occurrences between two dates
 */
export function getOccurrencesBetween(
    recurrenceRule: RecurrenceRule,
    startDate: Date,
    endDate: Date,
): Date[] {
    try {
        const rruleString = convertRecurrenceRuleToString(recurrenceRule);
        const rrule = rrulestr(rruleString);
        return rrule.between(startDate, endDate);
    } catch {
        return [];
    }
}

/**
 * Check if a date matches a recurrence rule
 */
export function isOccurrenceOnDate(recurrenceRule: RecurrenceRule, date: Date): boolean {
    try {
        const rruleString = convertRecurrenceRuleToString(recurrenceRule);
        const rrule = rrulestr(rruleString);
        const occurrences = rrule.between(date, date);
        return occurrences.length > 0;
    } catch {
        return false;
    }
}
