import { FreeBusyResponse } from '@/schema/google/freebusy';
import { BaseCalendarService } from '@/services/calendar/base';
import { FreeBusyIncludeCalendarsOptions, FreeBusyOmitCalendarsOptions } from '@/types/tools/event';
import { Account } from 'better-auth';
import { calendar_v3 } from 'googleapis';

export class AvailabilityService extends BaseCalendarService {
    /**
     * Check availability for a time block
     */
    async getAvailability(options: FreeBusyOmitCalendarsOptions): Promise<string> {
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
            const calendar = await this.getCalendarApi(account.id);
            const response = await this.queryFreeBusy(calendar, {
                ...options,
                calendars: calendarIds.map((id) => ({ id })),
            });
            freeBusyResponses.push(response);
        }

        return this.generateAvailabilitySummaryForMultiple(freeBusyResponses);
    }

    private async queryFreeBusy(
        calendar: calendar_v3.Calendar,
        options: FreeBusyIncludeCalendarsOptions,
    ): Promise<FreeBusyResponse> {
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: options.timeMin,
                timeMax: options.timeMax,
                timeZone: options.timeZone,
                groupExpansionMax: options.groupExpansionMax,
                calendarExpansionMax: options.calendarExpansionMax,
                items: options.calendars,
            },
        });

        if (!response.data) throw new Error('Failed to get free/busy information');
        return response.data as FreeBusyResponse;
    }

    private isLessThanThreeMonths(timeMin: string, timeMax: string): boolean {
        const minDate = new Date(timeMin);
        const maxDate = new Date(timeMax);

        const diffInMilliseconds = maxDate.getTime() - minDate.getTime();
        const threeMonthsInMilliseconds = 3 * 30 * 24 * 60 * 60 * 1000;

        // Check if the difference is less than or equal to 3 months
        return diffInMilliseconds <= threeMonthsInMilliseconds;
    }

    private generateAvailabilitySummary(response: FreeBusyResponse): string {
        return Object.entries(response.calendars)
            .map(([email, calendarInfo]) => {
                if (calendarInfo.errors?.some((error) => error.reason === 'notFound')) {
                    return `Cannot check availability for ${email} (account not found)\n`;
                }

                if (calendarInfo.busy.length === 0) {
                    return `${email} is available during ${response.timeMin} to ${response.timeMax}, please schedule calendar to ${email} if you want \n`;
                }

                const busyTimes = calendarInfo.busy
                    .map((slot) => `- From ${slot.start} to ${slot.end}`)
                    .join('\n');
                return `${email} is busy during:\n${busyTimes}\n`;
            })
            .join('\n')
            .trim();
    }

    private generateAvailabilitySummaryForMultiple(responses: FreeBusyResponse[]): string {
        return responses
            .map((response, index) => {
                const summary = this.generateAvailabilitySummary(response);
                return `Account ${index + 1}:\n${summary}`;
            })
            .join('\n\n')
            .trim();
    }
}
