import { BaseCalendarService } from './base';
import { SearchEventsFromPrimaryCalendarOptions } from '@/types/tools/event';
import { calendar_v3 } from 'googleapis';

export class SearchService extends BaseCalendarService {
    async search(options: SearchEventsFromPrimaryCalendarOptions): Promise<string> {
        const primaryCalendarId = await this.getPrimaryCalendarId();
        if (!primaryCalendarId) {
            throw new Error('Primary calendar not found');
        }

        const events = await this.searchEvents(primaryCalendarId, options);
        if (events.length === 0) {
            return 'No events found matching your search criteria.';
        }

        let summary = `Found ${events.length} event(s) matching your search:\n\n`;

        events.forEach((event, index) => {
            const eventDetails = this.formatEventWithDetails(event, primaryCalendarId);
            summary += `${index + 1}. ${eventDetails}\n\n`;
        });

        return summary;
    }

    private async searchEvents(
        calendarId: string,
        options: SearchEventsFromPrimaryCalendarOptions,
    ): Promise<calendar_v3.Schema$Event[]> {
        const connectionData = await this.getCalendarConnection(calendarId);
        if (!connectionData.account) {
            throw new Error('No account found for calendar connection');
        }

        const calendar = await this.getCalendarApi(connectionData.account.id);

        const timezone =
            options.timeZone || (await this.getCalendarDefaultTimezone(calendarId, calendar));

        const timeMin = this.convertToRFC3339(options.timeMin, timezone);
        const timeMax = this.convertToRFC3339(options.timeMax, timezone);

        const response = await calendar.events.list({
            calendarId: calendarId,
            q: options.query,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
        });

        return response.data.items || [];
    }
}
