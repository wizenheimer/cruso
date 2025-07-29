import { SlotSuggestionOptionsExcludeCalendars } from '@/types/tools/event';
import { BaseCalendarService } from './base';
import { Account } from 'better-auth';
import { FreeBusyIncludeCalendarsOptions } from '@/types/tools/event';
import { FreeBusyResponse } from '@/schema/google/freebusy';
import { calendar_v3 } from 'googleapis';
import { DateTime } from 'luxon';

export class SlotSuggestionService extends BaseCalendarService {
    async suggestSlots(options: SlotSuggestionOptionsExcludeCalendars): Promise<string> {
        console.log('suggestSlots input:', JSON.stringify(options, null, 2));

        // Get all active connections
        const connections = await this.getActiveConnections();

        // Group calendar ids by account
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

        const slots = await this.getSlots(
            freeBusyResponses,
            options.excludeSlots,
            options.slotDurationMinutes,
            options.timeZone || 'UTC',
        );
        return this.formatSlots(slots.slots, options.timeZone || 'UTC');
    }

    private async getSlots(
        freeBusyResponses: FreeBusyResponse[],
        excludeSlots: {
            startTime: string;
            endTime: string;
        }[],
        slotDurationMinutes: number,
        timezone: string,
    ): Promise<{
        slots: {
            startTime: string;
            endTime: string;
        }[];
    }> {
        if (freeBusyResponses.length === 0) {
            return { slots: [] };
        }

        // Get the time range from the first response using Luxon
        const timeMin = DateTime.fromISO(freeBusyResponses[0].timeMin);
        const timeMax = DateTime.fromISO(freeBusyResponses[0].timeMax);

        if (!timeMin.isValid || !timeMax.isValid) {
            console.error('Invalid time range from FreeBusy response');
            return { slots: [] };
        }

        console.log('Processing time range:', {
            timeMin: timeMin.toISO(),
            timeMax: timeMax.toISO(),
            timezone: timezone,
        });

        // Convert to the requested timezone for processing
        const timeMinInTZ = timeMin.setZone(timezone);
        const timeMaxInTZ = timeMax.setZone(timezone);

        console.log('Time range in requested timezone:', {
            timeMin: timeMinInTZ.toISO(),
            timeMax: timeMaxInTZ.toISO(),
            timeMinLocal: timeMinInTZ.toFormat('h:mm a'),
            timeMaxLocal: timeMaxInTZ.toFormat('h:mm a'),
        });

        // Collect all busy periods from all calendars using Luxon
        const allBusyPeriods: { start: DateTime; end: DateTime }[] = [];

        for (const response of freeBusyResponses) {
            for (const calendarId in response.calendars) {
                const calendar = response.calendars[calendarId];
                if (calendar.busy) {
                    for (const busyPeriod of calendar.busy) {
                        const start = DateTime.fromISO(busyPeriod.start).setZone(timezone);
                        const end = DateTime.fromISO(busyPeriod.end).setZone(timezone);

                        if (start.isValid && end.isValid) {
                            allBusyPeriods.push({ start, end });
                        }
                    }
                }
            }
        }

        console.log(
            'All busy periods:',
            allBusyPeriods.map((p) => ({
                start: p.start.toISO(),
                end: p.end.toISO(),
                startLocal: p.start.toFormat('h:mm a'),
                endLocal: p.end.toFormat('h:mm a'),
            })),
        );

        // Sort busy periods by start time
        allBusyPeriods.sort((a, b) => a.start.toMillis() - b.start.toMillis());

        // Merge overlapping busy periods
        const mergedBusyPeriods = this.mergeOverlappingTimeSlots(allBusyPeriods);

        console.log(
            'Merged busy periods:',
            mergedBusyPeriods.map((p) => ({
                start: p.start.toISO(),
                end: p.end.toISO(),
                startLocal: p.start.toFormat('h:mm a'),
                endLocal: p.end.toFormat('h:mm a'),
            })),
        );

        // Convert exclude slots to DateTime objects
        const excludeSlotsDates = excludeSlots
            .map((slot) => ({
                start: DateTime.fromISO(slot.startTime).setZone(timezone),
                end: DateTime.fromISO(slot.endTime).setZone(timezone),
            }))
            .filter((slot) => slot.start.isValid && slot.end.isValid);

        // Find available slots
        const availableSlots: { startTime: string; endTime: string }[] = [];
        let currentTime = timeMinInTZ;

        // Round current time to the nearest 15-minute interval
        const minutes = currentTime.minute;
        const roundedMinutes = Math.floor(minutes / 15) * 15;
        currentTime = currentTime.set({ minute: roundedMinutes, second: 0, millisecond: 0 });

        console.log('Starting slot search from:', {
            currentTime: currentTime.toISO(),
            localTime: currentTime.toFormat('h:mm a'),
        });

        const slotDuration = { minutes: slotDurationMinutes };

        while (currentTime.plus(slotDuration) <= timeMaxInTZ) {
            const slotStart = currentTime;
            const slotEnd = currentTime.plus(slotDuration);

            // Check if this slot conflicts with any busy period
            const conflictsWithBusy = mergedBusyPeriods.some(
                (busy) => slotStart < busy.end && slotEnd > busy.start,
            );

            // Check if this slot conflicts with any excluded slot
            const conflictsWithExcluded = excludeSlotsDates.some(
                (excluded) => slotStart < excluded.end && slotEnd > excluded.start,
            );

            if (!conflictsWithBusy && !conflictsWithExcluded) {
                console.log('Found available slot:', {
                    start: slotStart.toISO(),
                    end: slotEnd.toISO(),
                    startLocal: slotStart.toFormat('h:mm a'),
                    endLocal: slotEnd.toFormat('h:mm a'),
                });

                availableSlots.push({
                    startTime: slotStart.toISO({ suppressMilliseconds: true }) || '',
                    endTime: slotEnd.toISO({ suppressMilliseconds: true }) || '',
                });

                // Stop after finding 3 slots
                if (availableSlots.length >= 3) {
                    break;
                }
            }

            // Move to next 15-minute interval
            currentTime = currentTime.plus({ minutes: 15 });
        }

        console.log('Final available slots:', availableSlots);
        return { slots: availableSlots };
    }

    /**
     * Merge overlapping time slots using Luxon
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

    private formatSlots(slots: { startTime: string; endTime: string }[], timezone: string): string {
        if (slots.length === 0) {
            return 'No available slots found in the specified time range.';
        }

        return slots
            .map((slot, index) => {
                try {
                    const startDate = DateTime.fromISO(slot.startTime).setZone(timezone);
                    const endDate = DateTime.fromISO(slot.endTime).setZone(timezone);

                    if (!startDate.isValid || !endDate.isValid) {
                        console.error('Invalid slot times:', { slot, timezone });
                        return `${index + 1}. Invalid slot time`;
                    }

                    // Format using Luxon in the requested timezone
                    const dateStr = startDate.toFormat('ccc, MMM d');
                    const startTimeStr = startDate.toFormat('h:mm a');
                    const endTimeStr = endDate.toFormat('h:mm a');

                    return `${index + 1}. ${dateStr} from ${startTimeStr} to ${endTimeStr}`;
                } catch (error) {
                    console.error('Error formatting slot:', error, slot);
                    return `${index + 1}. Error formatting slot`;
                }
            })
            .join('\n');
    }

    private async queryFreeBusy(
        calendar: calendar_v3.Calendar,
        options: FreeBusyIncludeCalendarsOptions,
    ): Promise<FreeBusyResponse> {
        try {
            console.log('querying free/busy with options', options);

            // Parse and validate input times using Luxon
            const { timeMin, timeMax } = this.parseAndValidateTimes(
                options.timeMin,
                options.timeMax,
                options.timeZone || 'UTC',
            );

            console.log('timeMin post convert', timeMin);
            console.log('timeMax post convert', timeMax);

            const requestBody = {
                timeMin,
                timeMax,
                timeZone: options.timeZone,
                groupExpansionMax: options.groupExpansionMax,
                calendarExpansionMax: options.calendarExpansionMax,
                items: options.calendars,
            };

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
     * Parse and validate time inputs using Luxon instead of manual conversion
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
                if (this.hasTimezoneInfoLuxon(minParsed) && this.hasTimezoneInfoLuxon(maxParsed)) {
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
}
