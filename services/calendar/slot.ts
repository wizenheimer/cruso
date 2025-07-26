import { SlotSuggestionOptionsExcludeCalendars } from '@/types/tools/event';
import { BaseCalendarService } from './base';
import { Account } from 'better-auth';
import { FreeBusyIncludeCalendarsOptions } from '@/types/tools/event';
import { FreeBusyResponse } from '@/schema/google/freebusy';
import { calendar_v3 } from 'googleapis';

export class SlotSuggestionService extends BaseCalendarService {
    async suggestSlots(options: SlotSuggestionOptionsExcludeCalendars): Promise<string> {
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
        );
        return this.formatSlots(slots.slots);
    }

    private async getSlots(
        freeBusyResponses: FreeBusyResponse[],
        excludeSlots: {
            startTime: string;
            endTime: string;
        }[],
        slotDurationMinutes: number,
    ): Promise<{
        slots: {
            startTime: string;
            endTime: string;
        }[];
    }> {
        if (freeBusyResponses.length === 0) {
            return { slots: [] };
        }

        // Get the time range from the first response
        const timeMin = new Date(freeBusyResponses[0].timeMin);
        const timeMax = new Date(freeBusyResponses[0].timeMax);

        // Convert slot duration to milliseconds
        const slotDurationMs = slotDurationMinutes * 60 * 1000;

        // Collect all busy periods from all calendars
        const allBusyPeriods: { start: Date; end: Date }[] = [];

        for (const response of freeBusyResponses) {
            for (const calendarId in response.calendars) {
                const calendar = response.calendars[calendarId];
                if (calendar.busy) {
                    for (const busyPeriod of calendar.busy) {
                        allBusyPeriods.push({
                            start: new Date(busyPeriod.start),
                            end: new Date(busyPeriod.end),
                        });
                    }
                }
            }
        }

        // Sort busy periods by start time
        allBusyPeriods.sort((a, b) => a.start.getTime() - b.start.getTime());

        // Merge overlapping busy periods
        const mergedBusyPeriods: { start: Date; end: Date }[] = [];
        for (const period of allBusyPeriods) {
            if (mergedBusyPeriods.length === 0) {
                mergedBusyPeriods.push(period);
            } else {
                const lastPeriod = mergedBusyPeriods[mergedBusyPeriods.length - 1];
                if (period.start <= lastPeriod.end) {
                    // Overlapping periods, merge them
                    lastPeriod.end = new Date(
                        Math.max(lastPeriod.end.getTime(), period.end.getTime()),
                    );
                } else {
                    // Non-overlapping, add new period
                    mergedBusyPeriods.push(period);
                }
            }
        }

        // Convert exclude slots to Date objects
        const excludeSlotsDates = excludeSlots.map((slot) => ({
            start: new Date(slot.startTime),
            end: new Date(slot.endTime),
        }));

        // Find available slots
        const availableSlots: { startTime: string; endTime: string }[] = [];
        let currentTime = new Date(timeMin);

        // Round current time to the nearest 15-minute interval
        const minutes = currentTime.getMinutes();
        const roundedMinutes = Math.floor(minutes / 15) * 15;
        currentTime.setMinutes(roundedMinutes, 0, 0);

        while (currentTime.getTime() + slotDurationMs <= timeMax.getTime()) {
            const slotStart = new Date(currentTime);
            const slotEnd = new Date(currentTime.getTime() + slotDurationMs);

            // Check if this slot conflicts with any busy period
            const conflictsWithBusy = mergedBusyPeriods.some(
                (busy) => slotStart < busy.end && slotEnd > busy.start,
            );

            // Check if this slot conflicts with any excluded slot
            const conflictsWithExcluded = excludeSlotsDates.some(
                (excluded) => slotStart < excluded.end && slotEnd > excluded.start,
            );

            if (!conflictsWithBusy && !conflictsWithExcluded) {
                availableSlots.push({
                    startTime: slotStart.toISOString(),
                    endTime: slotEnd.toISOString(),
                });

                // Stop after finding 3 slots
                if (availableSlots.length >= 3) {
                    break;
                }
            }

            // Move to next 15-minute interval
            currentTime = new Date(currentTime.getTime() + 15 * 60 * 1000);
        }

        return { slots: availableSlots };
    }

    private formatSlots(slots: { startTime: string; endTime: string }[]): string {
        if (slots.length === 0) {
            return 'No available slots found in the specified time range.';
        }

        return slots
            .map((slot, index) => {
                const startDate = new Date(slot.startTime);
                const endDate = new Date(slot.endTime);

                // Format the date and time in a user-friendly way
                const dateOptions: Intl.DateTimeFormatOptions = {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                };

                const timeOptions: Intl.DateTimeFormatOptions = {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                };

                const dateStr = startDate.toLocaleDateString('en-US', dateOptions);
                const startTimeStr = startDate.toLocaleTimeString('en-US', timeOptions);
                const endTimeStr = endDate.toLocaleTimeString('en-US', timeOptions);

                return `${index + 1}. ${dateStr} from ${startTimeStr} to ${endTimeStr}`;
            })
            .join('\n');
    }

    private async queryFreeBusy(
        calendar: calendar_v3.Calendar,
        options: FreeBusyIncludeCalendarsOptions,
    ): Promise<FreeBusyResponse> {
        try {
            // Convert timezone-naive datetime strings to RFC 3339 format
            const timeMin = this.convertToRFC3339(options.timeMin, options.timeZone || 'UTC');
            const timeMax = this.convertToRFC3339(options.timeMax, options.timeZone || 'UTC');

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
}
