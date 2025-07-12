import { PREFERENCES_DEFAULTS } from './preferences-constants';

// Types for document generation
export interface AvailabilitySlot {
    days: number[]; // [1,2,3,4,5] for Mon-Fri (1=Monday, 7=Sunday)
    startTime: string; // "09:00" or "09:00:00"
    endTime: string; // "17:00" or "17:00:00"
    timezone: string;
}

export interface PreferencesData {
    // Personal Info - from preferences table
    displayName?: string;
    nickname?: string;

    // Availability - computed from availability table
    availability?: AvailabilitySlot[];
    defaultTimezone?: string; // fallback timezone from preferences table

    // Scheduling - from preferences table
    minNoticeMinutes?: number;
    defaultMeetingDurationMinutes?: number;

    // Buffer settings - from preferences table
    virtualBufferMinutes?: number;
    inPersonBufferMinutes?: number;
    backToBackBufferMinutes?: number;
    flightBufferMinutes?: number;
}

/**
 * Generate preferences markdown document
 */
export function generatePreferencesMarkdown(data: PreferencesData): string {
    const sections: string[] = [];

    // General Preferences Header
    sections.push('# General Preferences\n');

    // Personal Info Section
    if (data.displayName || data.nickname) {
        sections.push('## Personal Info\n');
        if (data.displayName) {
            sections.push(`- My full name is ${data.displayName}.\n`);
        }
        if (data.nickname) {
            sections.push(`- You can call me ${data.nickname}.\n`);
        }
    }

    // Availability Section
    if (data.availability && data.availability.length > 0) {
        sections.push('## Availability\n');

        const workingHours = formatAvailability(data.availability);
        workingHours.forEach((hours) => {
            sections.push(`- My working hours are typically ${hours}.\n`);
        });

        // Use timezone from first availability slot, or fallback to default
        const timezone = data.availability[0]?.timezone || data.defaultTimezone;
        if (timezone) {
            sections.push(`- My timezone is usually ${timezone}.\n`);
        }
    }

    // Scheduling Section
    if (
        data.minNoticeMinutes !== undefined ||
        data.defaultMeetingDurationMinutes !== undefined ||
        data.virtualBufferMinutes !== undefined ||
        data.inPersonBufferMinutes !== undefined ||
        data.backToBackBufferMinutes !== undefined ||
        data.flightBufferMinutes !== undefined
    ) {
        sections.push('## Scheduling\n');

        if (data.minNoticeMinutes !== undefined) {
            const hours = Math.floor(data.minNoticeMinutes / 60);
            const minutes = data.minNoticeMinutes % 60;
            if (hours > 0 && minutes > 0) {
                sections.push(
                    `- Minimum notice for meetings: ${hours} hours and ${minutes} minutes.\n`,
                );
            } else if (hours > 0) {
                sections.push(`- Minimum notice for meetings: ${hours} hours.\n`);
            } else {
                sections.push(`- Minimum notice for meetings: ${minutes} minutes.\n`);
            }
        }

        if (data.defaultMeetingDurationMinutes !== undefined) {
            sections.push(
                `- I usually schedule ${data.defaultMeetingDurationMinutes}-minute meetings.\n`,
            );
        }

        // Buffer rules section
        const hasBufferRules =
            data.virtualBufferMinutes !== undefined ||
            data.inPersonBufferMinutes !== undefined ||
            data.backToBackBufferMinutes !== undefined ||
            data.flightBufferMinutes !== undefined;

        if (hasBufferRules) {
            sections.push('- Apply these buffer rules:\n');

            if (data.virtualBufferMinutes !== undefined) {
                if (data.virtualBufferMinutes === 0) {
                    sections.push('  - All events: No buffer\n');
                } else {
                    sections.push(
                        `  - Virtual meetings: ${data.virtualBufferMinutes} minutes buffer\n`,
                    );
                }
            }

            if (data.inPersonBufferMinutes !== undefined) {
                if (data.inPersonBufferMinutes === 0) {
                    sections.push('  - In-person events: No buffer\n');
                } else {
                    sections.push(
                        `  - In-person events: ${data.inPersonBufferMinutes} minutes before and after\n`,
                    );
                }
            }

            if (data.backToBackBufferMinutes !== undefined) {
                if (data.backToBackBufferMinutes === 0) {
                    sections.push('  - Back-to-back: No buffer\n');
                } else {
                    sections.push(
                        `  - Back-to-back: ${data.backToBackBufferMinutes} minutes buffer\n`,
                    );
                }
            }

            if (data.flightBufferMinutes !== undefined) {
                if (data.flightBufferMinutes === 0) {
                    sections.push('  - Travel: No buffer\n');
                } else {
                    sections.push(
                        `  - Travel: ${data.flightBufferMinutes} minutes before and after\n`,
                    );
                }
            }
        }
    }

    return sections.join('');
}

/**
 * Format availability slots into readable working hours
 */
export function formatAvailability(availability: AvailabilitySlot[]): string[] {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return availability.map((slot) => {
        const days = slot.days || [];
        const startTime = formatTime(slot.startTime);
        const endTime = formatTime(slot.endTime);

        if (days.length === 0) {
            return `${startTime} to ${endTime}`;
        }

        const dayRanges = getDayRanges(days, dayNames);
        return `${dayRanges} from ${startTime} to ${endTime}`;
    });
}

/**
 * Format time from 24h to 12h format
 */
export function formatTime(time: string): string {
    // Convert "09:00:00" to "9:00 AM"
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Get day ranges from day numbers
 */
export function getDayRanges(days: number[], dayNames: string[]): string {
    if (days.length === 0) return '';
    if (days.length === 1) return dayNames[days[0] - 1];

    const ranges: string[] = [];
    let start = days[0];
    let end = days[0];

    for (let i = 1; i < days.length; i++) {
        if (days[i] === end + 1) {
            end = days[i];
        } else {
            if (start === end) {
                ranges.push(dayNames[start - 1]);
            } else {
                ranges.push(`${dayNames[start - 1]} to ${dayNames[end - 1]}`);
            }
            start = end = days[i];
        }
    }

    if (start === end) {
        ranges.push(dayNames[start - 1]);
    } else {
        ranges.push(`${dayNames[start - 1]} to ${dayNames[end - 1]}`);
    }

    return ranges.join(', ');
}

/**
 * Generate preferences document with default values
 */
export function generateDefaultPreferencesDocument(
    displayName?: string,
    nickname?: string,
    timezone?: string,
): string {
    const preferencesData: PreferencesData = {
        displayName: displayName || undefined,
        nickname: nickname || undefined,
        availability: [], // No availability for new users
        defaultTimezone: timezone || undefined,
        minNoticeMinutes: PREFERENCES_DEFAULTS.MIN_NOTICE_MINUTES,
        defaultMeetingDurationMinutes: PREFERENCES_DEFAULTS.DEFAULT_MEETING_DURATION_MINUTES,
        virtualBufferMinutes: PREFERENCES_DEFAULTS.VIRTUAL_BUFFER_MINUTES,
        inPersonBufferMinutes: PREFERENCES_DEFAULTS.IN_PERSON_BUFFER_MINUTES,
        backToBackBufferMinutes: PREFERENCES_DEFAULTS.BACK_TO_BACK_BUFFER_MINUTES,
        flightBufferMinutes: PREFERENCES_DEFAULTS.FLIGHT_BUFFER_MINUTES,
    };

    return generatePreferencesMarkdown(preferencesData);
}
