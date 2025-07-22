import { BaseCalendarService } from './base';
import type { CalendarEvent, TimeRange } from '@/types/services';
import {
    SearchOptions,
    SearchResult,
    QuickSearchPresets,
    GetEventsOptions,
    GetEventsResult,
} from '@/types/services';

// Re-export types for convenience
export type {
    SearchOptions,
    SearchResult,
    QuickSearchPresets,
    GetEventsOptions,
    GetEventsResult,
} from '@/types/services';

// ==================================================
// Search Service Class
// ==================================================

export class CalendarSearchService extends BaseCalendarService {
    /**
     * Search events in the primary calendar with smart filtering
     */
    async searchPrimaryCalendarEvents(options: SearchOptions = {}): Promise<SearchResult> {
        const startTime = Date.now();

        console.log('┌─ [CALENDAR_SEARCH] Starting search...', {
            query: options.query,
            filters: Object.keys(options).filter(
                (k) => options[k as keyof SearchOptions] !== undefined,
            ),
        });

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();

            // Set default time range if not specified
            const timeMin =
                options.timeMin || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days ago
            const timeMax =
                options.timeMax || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days future

            // Fetch events from Google Calendar with basic filters
            const { events, nextPageToken } = await this.getEvents(
                primaryCalendarId,
                timeMin,
                timeMax,
                {
                    q: options.query, // Google's text search
                    maxResults: options.maxResults ? Math.min(options.maxResults * 2, 250) : 100, // Fetch extra for post-filtering
                    orderBy: options.orderBy || 'startTime',
                    singleEvents: options.expandRecurring !== false,
                    showDeleted: options.includeDeleted || false,
                    timeZone: options.timezone,
                },
            );

            console.log('├─ [CALENDAR_SEARCH] Retrieved events:', events.length);

            // Apply additional filters that Google Calendar API doesn't support
            let filteredEvents = this.applyAdvancedFilters(events, options);

            // Sort results
            filteredEvents = this.sortSearchResults(filteredEvents, options);

            // Limit results if needed
            if (options.maxResults && filteredEvents.length > options.maxResults) {
                filteredEvents = filteredEvents.slice(0, options.maxResults);
            }

            const executionTime = Date.now() - startTime;

            console.log('└─ [CALENDAR_SEARCH] Search completed:', {
                totalResults: filteredEvents.length,
                executionTime,
            });

            return {
                events: filteredEvents,
                totalResults: filteredEvents.length,
                executionTime,
                nextPageToken,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_SEARCH] Search failed:', error);
            throw new Error(
                `Failed to search calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Get quick search presets for common search patterns
     */
    getQuickSearchPresets(): QuickSearchPresets {
        return {
            todaysMeetings: async () => {
                const today = new Date();
                const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const endOfDay = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate() + 1,
                );

                return this.searchPrimaryCalendarEvents({
                    timeMin: startOfDay.toISOString(),
                    timeMax: endOfDay.toISOString(),
                    hasAttendees: true,
                    maxResults: 50,
                });
            },

            upcomingWeek: async () => {
                const now = new Date();
                const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

                return this.searchPrimaryCalendarEvents({
                    timeMin: now.toISOString(),
                    timeMax: weekFromNow.toISOString(),
                    maxResults: 100,
                });
            },

            recentlyCreated: async (days = 7) => {
                const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

                return this.searchPrimaryCalendarEvents({
                    createdAfter: cutoffDate.toISOString(),
                    maxResults: 50,
                });
            },

            withPerson: async (email: string, days = 30) => {
                const now = new Date();
                const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

                return this.searchPrimaryCalendarEvents({
                    timeMin: now.toISOString(),
                    timeMax: futureDate.toISOString(),
                    attendeeEmail: email,
                    maxResults: 50,
                });
            },

            longMeetings: async (minMinutes = 60) => {
                const now = new Date();
                const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

                return this.searchPrimaryCalendarEvents({
                    timeMin: now.toISOString(),
                    timeMax: monthFromNow.toISOString(),
                    minDuration: minMinutes,
                    maxResults: 50,
                });
            },

            recurringEvents: async () => {
                const now = new Date();
                const yearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

                return this.searchPrimaryCalendarEvents({
                    timeMin: now.toISOString(),
                    timeMax: yearFromNow.toISOString(),
                    isRecurring: true,
                    maxResults: 100,
                });
            },

            pastMeetings: async (days = 30) => {
                const now = new Date();
                const pastDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

                return this.searchPrimaryCalendarEvents({
                    timeMin: pastDate.toISOString(),
                    timeMax: now.toISOString(),
                    hasAttendees: true,
                    maxResults: 50,
                });
            },

            freeTextSearch: async (query: string) => {
                return this.searchPrimaryCalendarEvents({
                    query,
                    maxResults: 50,
                });
            },
        };
    }

    /**
     * Quick search with simple text query
     */
    async quickSearchPrimaryCalendar(query: string): Promise<CalendarEvent[]> {
        const result = await this.searchPrimaryCalendarEvents({ query, maxResults: 20 });
        return result.events;
    }

    // ==================================================
    // Private Helper Methods
    // ==================================================

    private applyAdvancedFilters(events: CalendarEvent[], options: SearchOptions): CalendarEvent[] {
        return events.filter((event) => {
            // Filter by attendees
            if (options.hasAttendees !== undefined) {
                const hasAttendees = event.attendees && event.attendees.length > 0;
                if (hasAttendees !== options.hasAttendees) {
                    return false;
                }
            }

            // Filter by specific attendee
            if (options.attendeeEmail) {
                const hasAttendee = event.attendees?.some(
                    (attendee) =>
                        attendee.email.toLowerCase() === options.attendeeEmail!.toLowerCase(),
                );
                if (!hasAttendee) {
                    return false;
                }
            }

            // Filter by location
            if (options.location) {
                const eventLocation = event.location?.toLowerCase() || '';
                const searchLocation = options.location.toLowerCase();
                if (!eventLocation.includes(searchLocation)) {
                    return false;
                }
            }

            // Filter by recurring events
            if (options.isRecurring !== undefined) {
                const isRecurring = !!event.recurringEventId;
                if (isRecurring !== options.isRecurring) {
                    return false;
                }
            }

            // Filter by all-day events
            if (options.isAllDay !== undefined) {
                const isAllDay = !!event.start.date; // All-day events have date instead of dateTime
                if (isAllDay !== options.isAllDay) {
                    return false;
                }
            }

            // Filter by creation date
            if (options.createdAfter && event.created) {
                const createdDate = new Date(event.created);
                const cutoffDate = new Date(options.createdAfter);
                if (createdDate < cutoffDate) {
                    return false;
                }
            }

            // Filter by update date
            if (options.updatedAfter && event.updated) {
                const updatedDate = new Date(event.updated);
                const cutoffDate = new Date(options.updatedAfter);
                if (updatedDate < cutoffDate) {
                    return false;
                }
            }

            // Filter by duration
            if (event.start.dateTime && event.end.dateTime) {
                const startTime = new Date(event.start.dateTime);
                const endTime = new Date(event.end.dateTime);
                const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

                if (options.minDuration && durationMinutes < options.minDuration) {
                    return false;
                }

                if (options.maxDuration && durationMinutes > options.maxDuration) {
                    return false;
                }
            }

            return true;
        });
    }

    private sortSearchResults(events: CalendarEvent[], options: SearchOptions): CalendarEvent[] {
        const ascending = options.ascending !== false; // Default to ascending

        return events.sort((a, b) => {
            let comparison = 0;

            switch (options.orderBy) {
                case 'updated':
                    if (a.updated && b.updated) {
                        comparison = new Date(a.updated).getTime() - new Date(b.updated).getTime();
                    }
                    break;

                case 'startTime':
                default:
                    // Sort by start time
                    const aStart = a.start.dateTime || a.start.date || '';
                    const bStart = b.start.dateTime || b.start.date || '';
                    comparison = new Date(aStart).getTime() - new Date(bStart).getTime();
                    break;
            }

            return ascending ? comparison : -comparison;
        });
    }

    /**
     * Get events from a specific calendar (helper method for search)
     */
    private async getEvents(
        calendarId: string,
        timeMin: string,
        timeMax: string,
        options?: GetEventsOptions,
    ): Promise<GetEventsResult> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const response = await calendar.events.list({
                calendarId,
                timeMin,
                timeMax,
                maxResults: options?.maxResults || 250,
                pageToken: options?.pageToken,
                q: options?.q,
                showDeleted: options?.showDeleted ?? false,
                singleEvents: options?.singleEvents ?? true,
                orderBy: options?.orderBy || 'startTime',
                timeZone: options?.timeZone,
                alwaysIncludeEmail: options?.alwaysIncludeEmail ?? false,
                iCalUID: options?.iCalUID,
            });

            const events = (response.data.items || []).map((event) =>
                this.transformGoogleEvent(event, options?.timeZone),
            );

            return {
                events,
                nextPageToken: response.data.nextPageToken || undefined,
                nextSyncToken: response.data.nextSyncToken || undefined,
            };
        } catch (error) {
            throw new Error(
                `Failed to get events: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}
