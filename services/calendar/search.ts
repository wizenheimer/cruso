import { BaseCalendarService } from './base';
import { SearchEventsFromPrimaryCalendarOptions } from '@/types/tools/event';
import { calendar_v3 } from 'googleapis';
import { DateTime } from 'luxon';

export class SearchService extends BaseCalendarService {
    async search(options: SearchEventsFromPrimaryCalendarOptions): Promise<string> {
        try {
            console.log('Searching events with options:', JSON.stringify(options, null, 2));

            const primaryCalendarId = await this.getPrimaryCalendarId();
            if (!primaryCalendarId) {
                throw new Error('Primary calendar not found');
            }

            const events = await this.searchEvents(primaryCalendarId, options);

            if (events.length === 0) {
                return this.formatNoResultsMessage(options);
            }

            return this.formatSearchResults(events, primaryCalendarId, options);
        } catch (error) {
            console.error('Error searching calendar events:', error);
            throw new Error(
                `Failed to search calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    private async searchEvents(
        calendarId: string,
        options: SearchEventsFromPrimaryCalendarOptions,
    ): Promise<calendar_v3.Schema$Event[]> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const timezone =
                options.timeZone || (await this.getCalendarDefaultTimezone(calendarId, calendar));

            console.log('Search parameters:', {
                query: options.query,
                timeMin: options.timeMin,
                timeMax: options.timeMax,
                timezone: timezone,
            });

            const timeMin = this.convertToRFC3339(options.timeMin, timezone);
            const timeMax = this.convertToRFC3339(options.timeMax, timezone);

            console.log('Converted time range for search:', {
                timeMin: timeMin,
                timeMax: timeMax,
            });

            const response = await calendar.events.list({
                calendarId: calendarId,
                q: options.query,
                timeMin,
                timeMax,
                singleEvents: true,
                orderBy: 'startTime',
            });

            const events = response.data.items || [];
            console.log(`Found ${events.length} events matching search criteria`);

            return events;
        } catch (error) {
            console.error('Error searching events:', error);
            throw new Error(
                `Failed to search events: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Format search results with AI-friendly structure
     */
    private formatSearchResults(
        events: calendar_v3.Schema$Event[],
        calendarId: string,
        options: SearchEventsFromPrimaryCalendarOptions,
    ): string {
        try {
            // Create structured header with search context
            const searchContext = this.formatSearchContext(options);
            let summary = `SEARCH RESULTS: Found ${events.length} event(s)\n\n`;

            if (searchContext) {
                summary += `${searchContext}\n\n`;
            }

            summary += 'EVENTS:\n';

            events.forEach((event, index) => {
                const eventDetails = this.formatEventWithDetails(event, calendarId);
                summary += `\n${index + 1}. ${eventDetails}`;

                // Add separator between events (except for last one)
                if (index < events.length - 1) {
                    summary += '\n' + '-'.repeat(50);
                }
            });

            return summary;
        } catch (error) {
            console.error('Error formatting search results:', error);
            return `Found ${events.length} events, but error occurred during formatting.`;
        }
    }

    /**
     * Format search context for AI clarity
     */
    private formatSearchContext(options: SearchEventsFromPrimaryCalendarOptions): string {
        try {
            const parts: string[] = [];

            if (options.query) {
                parts.push(`Query: "${options.query}"`);
            }

            if (options.timeMin || options.timeMax) {
                const timezone = options.timeZone || 'UTC';
                const timezoneAbbr = this.getTimezoneAbbreviation(timezone);

                if (options.timeMin && options.timeMax) {
                    const startTime = DateTime.fromISO(options.timeMin).setZone(timezone);
                    const endTime = DateTime.fromISO(options.timeMax).setZone(timezone);

                    if (startTime.isValid && endTime.isValid) {
                        parts.push(
                            `Time Range: ${startTime.toFormat('ccc, MMM d, h:mm a')} - ${endTime.toFormat('ccc, MMM d, h:mm a')} (${timezoneAbbr})`,
                        );
                    }
                } else if (options.timeMin) {
                    const startTime = DateTime.fromISO(options.timeMin).setZone(timezone);
                    if (startTime.isValid) {
                        parts.push(
                            `From: ${startTime.toFormat('ccc, MMM d, h:mm a')} (${timezoneAbbr})`,
                        );
                    }
                } else if (options.timeMax) {
                    const endTime = DateTime.fromISO(options.timeMax).setZone(timezone);
                    if (endTime.isValid) {
                        parts.push(
                            `Until: ${endTime.toFormat('ccc, MMM d, h:mm a')} (${timezoneAbbr})`,
                        );
                    }
                }
            }

            return parts.length > 0 ? `SEARCH CRITERIA:\n${parts.join('\n')}` : '';
        } catch (error) {
            console.error('Error formatting search context:', error);
            return '';
        }
    }

    /**
     * Format no results message with search context
     */
    private formatNoResultsMessage(options: SearchEventsFromPrimaryCalendarOptions): string {
        try {
            let message = 'SEARCH RESULTS: No events found\n\n';

            const searchContext = this.formatSearchContext(options);
            if (searchContext) {
                message += `${searchContext}\n\n`;
            }

            message += 'SUGGESTIONS:\n';
            message += '- Try using broader or different keywords\n';
            message += '- Expand the time range if searching within specific dates\n';
            message +=
                "- Consider asking the user to clarify or provide more details about what they're looking for";

            return message;
        } catch (error) {
            console.error('Error formatting no results message:', error);
            return 'No events found matching your search criteria.';
        }
    }
}
