import { WeeklySchedule } from '@/components/onboarding/types';

export interface DatabaseAvailability {
    id: number;
    days: number[] | null;
    startTime: string;
    endTime: string;
    timezone: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Convert database availability format to UI schedule format
 * Database: days [1,2,3,4,5] where 0=Sunday, 1=Monday, 2=Tuesday, etc.
 * UI: WeeklySchedule with day names as keys
 */
export function convertAvailabilityToSchedule(
    availability: DatabaseAvailability[],
): WeeklySchedule {
    const dayNames = [
        'Sunday', // 0
        'Monday', // 1
        'Tuesday', // 2
        'Wednesday', // 3
        'Thursday', // 4
        'Friday', // 5
        'Saturday', // 6
    ];

    // Initialize schedule with all days disabled
    const schedule: WeeklySchedule = {
        Monday: { enabled: false, timeSlots: [] },
        Tuesday: { enabled: false, timeSlots: [] },
        Wednesday: { enabled: false, timeSlots: [] },
        Thursday: { enabled: false, timeSlots: [] },
        Friday: { enabled: false, timeSlots: [] },
        Saturday: { enabled: false, timeSlots: [] },
        Sunday: { enabled: false, timeSlots: [] },
    };

    // Process each availability record
    availability.forEach((avail) => {
        if (avail.days && avail.days.length > 0) {
            avail.days.forEach((dayNum) => {
                // Database and UI both use 0=Sunday, 1=Monday, etc.
                // So we can use the day number directly as the index
                const dayName = dayNames[dayNum] as keyof WeeklySchedule;

                if (schedule[dayName]) {
                    schedule[dayName].enabled = true;
                    schedule[dayName].timeSlots.push({
                        id: `${avail.id}-${dayNum}`,
                        startTime: avail.startTime.substring(0, 5), // Convert HH:MM:SS to HH:MM
                        endTime: avail.endTime.substring(0, 5), // Convert HH:MM:SS to HH:MM
                    });
                }
            });
        }
    });

    return schedule;
}

/**
 * Convert UI schedule format to database availability format
 * UI: WeeklySchedule with day names as keys
 * Database: days [1,2,3,4,5] where 0=Sunday, 1=Monday, 2=Tuesday, etc.
 */
export function convertScheduleToAvailability(schedule: WeeklySchedule): Array<{
    days: number[];
    startTime: string;
    endTime: string;
}> {
    const dayNameToNumber: Record<string, number> = {
        Sunday: 0, // 0
        Monday: 1, // 1
        Tuesday: 2, // 2
        Wednesday: 3, // 3
        Thursday: 4, // 4
        Friday: 5, // 5
        Saturday: 6, // 6
    };

    const availability: Array<{
        days: number[];
        startTime: string;
        endTime: string;
    }> = [];

    // Group time slots by start/end times to create efficient availability records
    const timeSlotGroups = new Map<
        string,
        { days: number[]; startTime: string; endTime: string }
    >();

    Object.entries(schedule).forEach(([dayName, dayData]) => {
        if (dayData.enabled && dayData.timeSlots.length > 0) {
            const dayNumber = dayNameToNumber[dayName];

            dayData.timeSlots.forEach((slot) => {
                const key = `${slot.startTime}-${slot.endTime}`;

                if (!timeSlotGroups.has(key)) {
                    timeSlotGroups.set(key, {
                        days: [],
                        startTime: slot.startTime + ':00', // Convert HH:MM to HH:MM:SS
                        endTime: slot.endTime + ':00', // Convert HH:MM to HH:MM:SS
                    });
                }

                timeSlotGroups.get(key)!.days.push(dayNumber);
            });
        }
    });

    // Convert groups to availability records
    timeSlotGroups.forEach((group) => {
        availability.push(group);
    });

    return availability;
}

/**
 * Convert time from HH:MM:SS to HH:MM format
 */
export function formatTimeForUI(time: string): string {
    return time.substring(0, 5);
}

/**
 * Convert time from HH:MM to HH:MM:SS format
 */
export function formatTimeForDatabase(time: string): string {
    return time.includes(':') && time.split(':').length === 2 ? time + ':00' : time;
}
