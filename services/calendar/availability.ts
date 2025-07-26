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

            return this.generateAvailabilitySummaryForMultiple(freeBusyResponses);
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

    private isLessThanThreeMonths(timeMin: string, timeMax: string): boolean {
        try {
            const minDate = new Date(timeMin);
            const maxDate = new Date(timeMax);

            const diffInMilliseconds = maxDate.getTime() - minDate.getTime();
            const threeMonthsInMilliseconds = 3 * 30 * 24 * 60 * 60 * 1000;

            // Check if the difference is less than or equal to 3 months
            return diffInMilliseconds <= threeMonthsInMilliseconds;
        } catch (error) {
            console.error('Error in isLessThanThreeMonths:', error);
            return false;
        }
    }

    private generateAvailabilitySummary(response: FreeBusyResponse): string {
        try {
            return Object.entries(response.calendars)
                .map(([email, calendarInfo]) => {
                    if (calendarInfo.errors?.some((error) => error.reason === 'notFound')) {
                        console.error(`could not find host's calendar, skipping calendar\n`);
                        return ``; // NOTE: prevent context pollution
                    }

                    if (calendarInfo.busy.length === 0) {
                        return `host is available during ${response.timeMin} to ${response.timeMax} \n`;
                    }

                    const busyTimes = calendarInfo.busy
                        .map((slot) => `- From ${slot.start} to ${slot.end}`)
                        .join('\n');
                    return `host is busy during:\n${busyTimes}\n`;
                })
                .join('\n')
                .trim();
        } catch (error) {
            console.error('Error in generateAvailabilitySummary:', error);
            return 'Error generating availability summary';
        }
    }

    private generateAvailabilitySummaryForMultiple(responses: FreeBusyResponse[]): string {
        try {
            return responses
                .map((response, index) => {
                    const summary = this.generateAvailabilitySummary(response);
                    return `Calendar ${index + 1} :\n${summary}`;
                })
                .join('\n\n')
                .trim();
        } catch (error) {
            console.error('Error in generateAvailabilitySummaryForMultiple:', error);
            return 'Error generating availability summary for multiple accounts';
        }
    }
}
