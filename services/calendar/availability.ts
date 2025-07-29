import { FreeBusyResponse } from '@/schema/google/freebusy';
import { BaseCalendarService } from '@/services/calendar/base';
import { FreeBusyIncludeCalendarsOptions, FreeBusyOmitCalendarsOptions } from '@/types/tools/event';
import { Account } from 'better-auth';
import { calendar_v3 } from 'googleapis';
import { DateTime } from 'luxon';

export class AvailabilityService extends BaseCalendarService {
    /**
     * Check availability for a time block
     */
    async getAvailability(options: FreeBusyOmitCalendarsOptions): Promise<string> {
        try {
            if (!this.isLessThanThreeMonths(options.timeMin, options.timeMax)) {
                throw new Error('Time range must be less than 3 months');
            }

            // Group calendar ids by account
            const connections = await this.getActiveConnections();
            const uniqueAccounts = new Map<string, { account: Account; calendarIds: string[] }>();
            for (const { account, connection } of connections) {
                if (!account) continue;
                if (!uniqueAccounts.has(account.id)) {
                    uniqueAccounts.set(account.id, { account, calendarIds: [] });
                }
                uniqueAccounts.get(account.id)?.calendarIds.push(connection.calendarId);
            }

            // Query free/busy for each account
            const freeBusyResponses: FreeBusyResponse[] = [];
            for (const { account, calendarIds } of uniqueAccounts.values()) {
                try {
                    const calendar = await this.getCalendarApi(account.id);
                    const response = await this.queryFreeBusy(calendar, {
                        ...options,
                        calendars: calendarIds.map((id) => ({ id })),
                    });
                    freeBusyResponses.push(response);
                } catch (error) {
                    console.error(`Failed to query calendar for account ${account.id}:`, error);
                    // Continue with other accounts even if one fails
                }
            }

            return this.generateAvailabilitySummaryForMultiple(freeBusyResponses, options.timeZone);
        } catch (error) {
            console.error('Error in getAvailability:', error);
            throw new Error(
                `Failed to get availability: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    private async queryFreeBusy(
        calendar: calendar_v3.Calendar,
        options: FreeBusyIncludeCalendarsOptions,
    ): Promise<FreeBusyResponse> {
        try {
            const timezone = options.timeZone || 'UTC';

            // Parse and validate input times using Luxon
            const { timeMin, timeMax } = this.parseAndValidateTimes(
                options.timeMin,
                options.timeMax,
                timezone,
            );

            const requestBody = {
                timeMin,
                timeMax,
                timeZone: timezone,
                groupExpansionMax: options.groupExpansionMax,
                calendarExpansionMax: options.calendarExpansionMax,
                items: options.calendars,
            };

            console.log('FreeBusy request:', JSON.stringify(requestBody, null, 2));

            const response = await calendar.freebusy.query({
                requestBody,
            });

            if (!response.data) throw new Error('Failed to get free/busy information');
            return response.data as FreeBusyResponse;
        } catch (error) {
            console.error('Error in queryFreeBusy:', error);
            throw new Error(
                `Failed to query free/busy: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Parse and validate time inputs using Luxon instead of regex
     */
    private parseAndValidateTimes(
        timeMin: string,
        timeMax: string,
        fallbackTimezone: string,
    ): { timeMin: string; timeMax: string } {
        try {
            let minDateTime: DateTime;
            let maxDateTime: DateTime;

            // Try to parse as ISO string first (handles both timezone-aware and naive)
            const minParsed = DateTime.fromISO(timeMin);
            const maxParsed = DateTime.fromISO(timeMax);

            if (minParsed.isValid && maxParsed.isValid) {
                // Check if the parsed times have timezone info
                if (this.hasTimezoneInfo(minParsed) && this.hasTimezoneInfo(maxParsed)) {
                    // Already have timezone info, use as-is
                    minDateTime = minParsed;
                    maxDateTime = maxParsed;
                } else {
                    // Timezone-naive, interpret in fallback timezone
                    minDateTime = DateTime.fromISO(timeMin, { zone: fallbackTimezone });
                    maxDateTime = DateTime.fromISO(timeMax, { zone: fallbackTimezone });
                }
            } else {
                throw new Error(
                    `Invalid datetime format. Min: ${minParsed.invalidReason}, Max: ${maxParsed.invalidReason}`,
                );
            }

            if (!minDateTime.isValid || !maxDateTime.isValid) {
                throw new Error('Failed to parse datetimes with timezone');
            }

            // Convert to UTC for Google Calendar API
            return {
                timeMin: minDateTime.toUTC().toISO({ suppressMilliseconds: true }) || timeMin,
                timeMax: maxDateTime.toUTC().toISO({ suppressMilliseconds: true }) || timeMax,
            };
        } catch (error) {
            console.error('Error parsing times:', error);
            throw new Error(
                `Invalid time format: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Check if DateTime has timezone info using Luxon properties
     */
    private hasTimezoneInfo(dt: DateTime): boolean {
        // If the zone is not 'local' or if it has an explicit offset, it has timezone info
        return dt.zone.type !== 'local' && dt.zone.type !== 'invalid';
    }

    /**
     * Check if time range is less than 3 months using Luxon
     */
    private isLessThanThreeMonths(timeMin: string, timeMax: string): boolean {
        try {
            const minDateTime = DateTime.fromISO(timeMin);
            const maxDateTime = DateTime.fromISO(timeMax);

            if (!minDateTime.isValid || !maxDateTime.isValid) {
                console.error('Invalid datetime format in time range validation');
                return false;
            }

            // Calculate the difference in months
            const diff = maxDateTime.diff(minDateTime, 'months');

            // Check if the difference is less than or equal to 3 months
            return diff.months <= 3;
        } catch (error) {
            console.error('Error in isLessThanThreeMonths:', error);
            return false;
        }
    }

    /**
     * Generate availability summary with ISO format times for AI agents
     */
    private generateAvailabilitySummary(response: FreeBusyResponse, timezone?: string): string {
        try {
            const timeMin = response.timeMin;
            const timeMax = response.timeMax;

            // Parse times for consistent formatting
            const minDt = DateTime.fromISO(timeMin);
            const maxDt = DateTime.fromISO(timeMax);

            let timeRangeDescription: string;
            if (minDt.isValid && maxDt.isValid && timezone) {
                // Convert to the requested timezone for description
                const minInTz = minDt.setZone(timezone);
                const maxInTz = maxDt.setZone(timezone);
                timeRangeDescription = `${minInTz.toISO({ suppressMilliseconds: true })} to ${maxInTz.toISO({ suppressMilliseconds: true })} (${timezone})`;
            } else {
                timeRangeDescription = `${timeMin} to ${timeMax}`;
            }

            return Object.entries(response.calendars)
                .map(([email, calendarInfo]) => {
                    if (calendarInfo.errors?.some((error) => error.reason === 'notFound')) {
                        console.error(`Could not find calendar ${email}, skipping\n`);
                        return ''; // Skip calendars that can't be found
                    }

                    if (calendarInfo.busy.length === 0) {
                        return `host is available during ${timeRangeDescription}`;
                    }

                    // Format busy times as ISO strings for AI agent clarity
                    const busyTimes = calendarInfo.busy
                        .map((slot) => {
                            try {
                                const startDt = DateTime.fromISO(slot.start);
                                const endDt = DateTime.fromISO(slot.end);

                                if (startDt.isValid && endDt.isValid && timezone) {
                                    // Convert to requested timezone
                                    const startInTz = startDt.setZone(timezone);
                                    const endInTz = endDt.setZone(timezone);
                                    return `- ${startInTz.toISO({ suppressMilliseconds: true })} to ${endInTz.toISO({ suppressMilliseconds: true })}`;
                                }
                            } catch (error) {
                                console.error('Error formatting busy time:', error);
                            }

                            // Fallback to original format
                            return `- ${slot.start} to ${slot.end}`;
                        })
                        .join('\n');

                    return `host is busy during:\n${busyTimes}`;
                })
                .filter((summary) => summary.length > 0) // Remove empty summaries
                .join('\n')
                .trim();
        } catch (error) {
            console.error('Error in generateAvailabilitySummary:', error);
            return 'Error generating availability summary';
        }
    }

    private generateAvailabilitySummaryForMultiple(
        responses: FreeBusyResponse[],
        timezone?: string,
    ): string {
        try {
            if (responses.length === 0) {
                return 'No calendar data available';
            }

            return responses
                .map((response, index) => {
                    const summary = this.generateAvailabilitySummary(response, timezone);
                    if (summary.trim().length === 0) {
                        return ''; // Skip empty summaries
                    }
                    return `Calendar ${index + 1}:\n${summary}`;
                })
                .filter((summary) => summary.length > 0)
                .join('\n\n')
                .trim();
        } catch (error) {
            console.error('Error in generateAvailabilitySummaryForMultiple:', error);
            return 'Error generating availability summary for multiple accounts';
        }
    }

    /**
     * Find available time slots within a given time range
     * Returns slots in ISO format for AI agent consumption
     */
    async findAvailableSlots(options: {
        timeMin: string;
        timeMax: string;
        timeZone: string;
        slotDurationMinutes: number;
        excludeSlots?: Array<{ start: string; end: string }>;
    }): Promise<Array<{ start: string; end: string; displayText: string }>> {
        try {
            console.log('findAvailableSlots input:', JSON.stringify(options, null, 2));

            // Get busy times from calendar
            const busyTimes = await this.getBusyTimes({
                timeMin: options.timeMin,
                timeMax: options.timeMax,
                timeZone: options.timeZone,
            });

            console.log(
                'Retrieved busy times:',
                busyTimes.map((bt) => ({
                    start: bt.start.toISO(),
                    end: bt.end.toISO(),
                })),
            );

            // Parse the time range - IMPORTANT: Keep in the requested timezone
            const startTime = DateTime.fromISO(options.timeMin);
            const endTime = DateTime.fromISO(options.timeMax);

            console.log('Parsed time range:', {
                startTime: startTime.toISO(),
                endTime: endTime.toISO(),
                timezone: options.timeZone,
            });

            if (!startTime.isValid || !endTime.isValid) {
                throw new Error(
                    `Invalid time range: start=${startTime.invalidReason}, end=${endTime.invalidReason}`,
                );
            }

            // Convert to the requested timezone for processing
            const startInRequestedTZ = startTime.setZone(options.timeZone);
            const endInRequestedTZ = endTime.setZone(options.timeZone);

            console.log('Time range in requested timezone:', {
                start: startInRequestedTZ.toISO(),
                end: endInRequestedTZ.toISO(),
                startLocal: startInRequestedTZ.toFormat('h:mm a'),
                endLocal: endInRequestedTZ.toFormat('h:mm a'),
            });

            // Combine busy times with excluded slots
            const allBusyTimes = [...busyTimes];
            if (options.excludeSlots) {
                for (const excludeSlot of options.excludeSlots) {
                    const excludeStart = DateTime.fromISO(excludeSlot.start);
                    const excludeEnd = DateTime.fromISO(excludeSlot.end);

                    if (excludeStart.isValid && excludeEnd.isValid) {
                        allBusyTimes.push({
                            start: excludeStart.setZone(options.timeZone),
                            end: excludeEnd.setZone(options.timeZone),
                        });
                    }
                }
            }

            // Sort busy times by start time
            allBusyTimes.sort((a, b) => a.start.toMillis() - b.start.toMillis());

            // Merge overlapping busy times
            const mergedBusyTimes = this.mergeOverlappingTimeSlots(allBusyTimes);

            console.log(
                'Merged busy times:',
                mergedBusyTimes.map((bt) => ({
                    start: bt.start.toISO(),
                    end: bt.end.toISO(),
                    startLocal: bt.start.toFormat('h:mm a'),
                    endLocal: bt.end.toFormat('h:mm a'),
                })),
            );

            // Find available gaps
            const availableSlots: Array<{ start: string; end: string; displayText: string }> = [];
            const slotDuration = { minutes: options.slotDurationMinutes };
            const incrementMinutes = 15; // 15-minute increments for slot start times

            let currentTime = startInRequestedTZ;

            for (const busySlot of mergedBusyTimes) {
                // Find slots before this busy time
                while (
                    currentTime.plus(slotDuration) <= busySlot.start &&
                    currentTime.plus(slotDuration) <= endInRequestedTZ
                ) {
                    const slotEnd = currentTime.plus(slotDuration);

                    console.log('Adding available slot:', {
                        start: currentTime.toISO(),
                        end: slotEnd.toISO(),
                        startLocal: currentTime.toFormat('h:mm a'),
                        endLocal: slotEnd.toFormat('h:mm a'),
                    });

                    availableSlots.push({
                        start: currentTime.toISO({ suppressMilliseconds: true }) || '',
                        end: slotEnd.toISO({ suppressMilliseconds: true }) || '',
                        displayText: `${currentTime.toFormat('ccc, MMM d')} from ${currentTime.toFormat('h:mm a')} to ${slotEnd.toFormat('h:mm a')}`,
                    });

                    currentTime = currentTime.plus({ minutes: incrementMinutes });

                    // Limit to reasonable number of slots
                    if (availableSlots.length >= 50) break;
                }

                // Move current time past this busy slot
                currentTime = DateTime.max(currentTime, busySlot.end);

                // Round up to next increment
                const minutesPastIncrement = currentTime.minute % incrementMinutes;
                if (minutesPastIncrement > 0) {
                    currentTime = currentTime.plus({
                        minutes: incrementMinutes - minutesPastIncrement,
                    });
                }

                if (availableSlots.length >= 50) break;
            }

            // Find slots after the last busy time
            while (
                currentTime.plus(slotDuration) <= endInRequestedTZ &&
                availableSlots.length < 50
            ) {
                const slotEnd = currentTime.plus(slotDuration);

                console.log('Adding available slot (after busy times):', {
                    start: currentTime.toISO(),
                    end: slotEnd.toISO(),
                    startLocal: currentTime.toFormat('h:mm a'),
                    endLocal: slotEnd.toFormat('h:mm a'),
                });

                availableSlots.push({
                    start: currentTime.toISO({ suppressMilliseconds: true }) || '',
                    end: slotEnd.toISO({ suppressMilliseconds: true }) || '',
                    displayText: `${currentTime.toFormat('ccc, MMM d')} from ${currentTime.toFormat('h:mm a')} to ${slotEnd.toFormat('h:mm a')}`,
                });

                currentTime = currentTime.plus({ minutes: incrementMinutes });
            }

            console.log('Final available slots:', availableSlots);

            return availableSlots;
        } catch (error) {
            console.error('Error finding available slots:', error);
            return [];
        }
    }

    /**
     * Get busy times from all calendars as DateTime objects
     */
    private async getBusyTimes(options: {
        timeMin: string;
        timeMax: string;
        timeZone: string;
    }): Promise<Array<{ start: DateTime; end: DateTime }>> {
        try {
            // Get active calendar connections
            const connections = await this.getActiveConnections();
            const uniqueAccounts = new Map<string, { account: Account; calendarIds: string[] }>();

            for (const { account, connection } of connections) {
                if (!account) continue;
                if (!uniqueAccounts.has(account.id)) {
                    uniqueAccounts.set(account.id, { account, calendarIds: [] });
                }
                uniqueAccounts.get(account.id)?.calendarIds.push(connection.calendarId);
            }

            const allBusyTimes: Array<{ start: DateTime; end: DateTime }> = [];

            // Query each account for busy times
            for (const { account, calendarIds } of uniqueAccounts.values()) {
                try {
                    const calendar = await this.getCalendarApi(account.id);
                    const response = await this.queryFreeBusy(calendar, {
                        ...options,
                        calendars: calendarIds.map((id) => ({ id })),
                    });

                    // Extract busy times from response
                    for (const [email, calendarInfo] of Object.entries(response.calendars)) {
                        if (calendarInfo.errors?.some((error) => error.reason === 'notFound')) {
                            continue; // Skip calendars that can't be found
                        }

                        for (const busySlot of calendarInfo.busy) {
                            const startTime = DateTime.fromISO(busySlot.start, {
                                zone: options.timeZone,
                            });
                            const endTime = DateTime.fromISO(busySlot.end, {
                                zone: options.timeZone,
                            });

                            if (startTime.isValid && endTime.isValid) {
                                allBusyTimes.push({
                                    start: startTime,
                                    end: endTime,
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Failed to get busy times for account ${account.id}:`, error);
                    // Continue with other accounts
                }
            }

            return allBusyTimes;
        } catch (error) {
            console.error('Error getting busy times:', error);
            return [];
        }
    }

    /**
     * Merge overlapping time slots
     */
    private mergeOverlappingTimeSlots(
        timeSlots: Array<{ start: DateTime; end: DateTime }>,
    ): Array<{ start: DateTime; end: DateTime }> {
        if (timeSlots.length === 0) return [];

        // Sort by start time
        const sorted = [...timeSlots].sort((a, b) => a.start.toMillis() - b.start.toMillis());
        const merged: Array<{ start: DateTime; end: DateTime }> = [sorted[0]];

        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const lastMerged = merged[merged.length - 1];

            // If current slot overlaps with or is adjacent to the last merged slot
            if (current.start <= lastMerged.end) {
                // Merge by extending the end time
                lastMerged.end = DateTime.max(lastMerged.end, current.end);
            } else {
                // No overlap, add as new slot
                merged.push(current);
            }
        }

        return merged;
    }
}
