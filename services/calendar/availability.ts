import { createCalendarService } from '@/services/calendar/service';
import { auth } from '@/lib/auth';
import { AvailabilityResult } from '@/types/calendar';
/**
 * AvailabilityChecker is a class that checks the availability of a user.
 */
export class AvailabilityChecker {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    /**
     * Check if a user is available during a specific time slot
     * @param startTime - The start time of the time slot
     * @param endTime - The end time of the time slot
     * @returns True if the user is available, false otherwise
     */
    async isAvailable(startTime: Date, endTime: Date): Promise<boolean> {
        try {
            const calendarService = createCalendarService(this.userId);

            const result = await calendarService.checkAvailability(
                startTime.toISOString(),
                endTime.toISOString(),
            );

            return result.isAvailable;
        } catch (error) {
            return false;
        }
    }

    /**
     * Find the next available time slot
     * @param startFromTime - The start time of the time slot
     * @param durationMinutes - The duration of the time slot
     * @param searchWindowDays - The number of days to search for available slots
     * @returns The next available time slot
     */
    async findNextAvailableSlot(
        startFromTime: Date,
        durationMinutes: number,
        searchWindowDays: number = 7,
    ): Promise<{ start: Date; end: Date } | null> {
        const searchEndTime = new Date(
            startFromTime.getTime() + searchWindowDays * 24 * 60 * 60 * 1000,
        );

        let currentTime = new Date(startFromTime);

        while (currentTime < searchEndTime) {
            const proposedEndTime = new Date(currentTime.getTime() + durationMinutes * 60000);

            const isAvailable = await this.isAvailable(currentTime, proposedEndTime);

            if (isAvailable) {
                return { start: currentTime, end: proposedEndTime };
            }

            // Move forward by 30 minutes
            currentTime = new Date(currentTime.getTime() + 30 * 60000);
        }

        return null;
    }

    /**
     * Get busy times for a specific date range
     * @param startTime - The start time of the date range
     * @param endTime - The end time of the date range
     * @returns The busy times for the date range
     */
    async getBusyTimes(startTime: Date, endTime: Date): Promise<Array<{ start: Date; end: Date }>> {
        try {
            const calendarService = createCalendarService(this.userId);
            const result = await calendarService.checkAvailability(
                startTime.toISOString(),
                endTime.toISOString(),
            );

            return result.events.map((event: { start: string; end: string }) => ({
                start: new Date(event.start),
                end: new Date(event.end),
            }));
        } catch (error) {
            return [];
        }
    }
}

/**
 * Get the calendar service for a user
 * @param headers - The headers of the request
 * @returns The calendar service for the user
 */
export async function getUserCalendarService(headers: Headers) {
    try {
        const session = await auth.api.getSession({ headers });
        if (!session) {
            return null;
        }
        return createCalendarService(session.user.id);
    } catch (error) {
        return null;
    }
}

/**
 * Check user availability
 * @param userId - The id of the user
 * @param startTime - The start time of the time slot
 * @param endTime - The end time of the time slot
 * @returns The availability of the user
 */
export async function checkUserAvailability(
    userId: string,
    startTime: Date,
    endTime: Date,
): Promise<{
    isAvailable: boolean;
    events: Array<{
        id: string;
        summary: string;
        start: string;
        end: string;
        calendarId: string;
        calendarName: string;
    }>;
}> {
    try {
        const calendarService = createCalendarService(userId);
        const result = await calendarService.checkAvailability(
            startTime.toISOString(),
            endTime.toISOString(),
        );

        return {
            isAvailable: result.isAvailable,
            events: result.events,
        };
    } catch (error) {
        return { isAvailable: false, events: [] };
    }
}

/**
 * Find meeting slots between multiple users
 * @param userIds - The ids of the users
 * @param durationMinutes - The duration of the time slot
 * @param startDate - The start date of the time slot
 * @param endDate - The end date of the time slot
 * @returns The meeting slots between the users
 */
export async function findMeetingSlots(
    userIds: string[],
    durationMinutes: number,
    startDate: Date,
    endDate: Date,
): Promise<Array<{ start: Date; end: Date }>> {
    try {
        // Get all busy times for all users
        const allBusyTimes: Array<{ start: Date; end: Date }> = [];

        for (const userId of userIds) {
            const calendarService = createCalendarService(userId);
            const result = await calendarService.checkAvailability(
                startDate.toISOString(),
                endDate.toISOString(),
            );

            allBusyTimes.push(
                ...result.events.map((event: { start: string; end: string }) => ({
                    start: new Date(event.start),
                    end: new Date(event.end),
                })),
            );
        }

        // Sort busy times by start time
        allBusyTimes.sort((a, b) => a.start.getTime() - b.start.getTime());

        // Find available slots
        const availableSlots: Array<{ start: Date; end: Date }> = [];
        let currentTime = new Date(startDate);

        for (const busyTime of allBusyTimes) {
            // If there's a gap before this busy time
            if (currentTime < busyTime.start) {
                const gapDuration = busyTime.start.getTime() - currentTime.getTime();
                const requiredDuration = durationMinutes * 60000;

                if (gapDuration >= requiredDuration) {
                    availableSlots.push({
                        start: new Date(currentTime),
                        end: new Date(currentTime.getTime() + requiredDuration),
                    });
                }
            }

            // Move current time to after this busy period
            if (busyTime.end > currentTime) {
                currentTime = new Date(busyTime.end);
            }
        }

        // Check if there's time available after the last busy period
        if (currentTime < endDate) {
            const remainingTime = endDate.getTime() - currentTime.getTime();
            const requiredDuration = durationMinutes * 60000;

            if (remainingTime >= requiredDuration) {
                availableSlots.push({
                    start: new Date(currentTime),
                    end: new Date(currentTime.getTime() + requiredDuration),
                });
            }
        }

        return availableSlots;
    } catch (error) {
        return [];
    }
}
