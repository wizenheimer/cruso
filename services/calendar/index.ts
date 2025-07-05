import { calendar_v3 } from 'googleapis';
import { googleAuth } from '@/services/auth/google';
import { getUserGoogleAuth } from '@/db/queries/calendar';

export interface CalendarEvent {
    id?: string;
    summary: string;
    description?: string | undefined;
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
    attendees?: Array<{
        email: string;
        displayName?: string;
    }>;
    location?: string;
    conferenceData?: any;
}

export interface CalendarInfo {
    id: string;
    summary: string;
    description?: string | undefined;
    primary?: boolean | undefined;
    accessRole: string;
    backgroundColor?: string | undefined;
}

// GoogleCalendarService is a class that provides a service for interacting with the Google Calendar API.
export class GoogleCalendarService {
    private calendar: calendar_v3.Calendar;
    private userId?: number;

    constructor(userId?: number) {
        this.userId = userId;
        this.calendar = googleAuth.getCalendarAPI();
    }

    // ensureUserAuth is a private method that ensures the user is authenticated.
    private async ensureUserAuth(): Promise<void> {
        if (this.userId) {
            const authResult = await getUserGoogleAuth(this.userId);
            if (!authResult.success) {
                throw new Error(
                    `Calendar access requires Google authentication. ${authResult.error}. Please connect your Google Calendar first.`,
                );
            }
            // Reinitialize the calendar API with user-specific auth
            this.calendar = googleAuth.getCalendarAPI();
        }
    }

    // listCalendars is a method that lists the calendars for the user.
    async listCalendars(): Promise<CalendarInfo[]> {
        try {
            await this.ensureUserAuth();
            const response = await this.calendar.calendarList.list();

            return (
                response.data.items?.map((item) => ({
                    id: item.id!,
                    summary: item.summary!,
                    description: item.description || undefined,
                    primary: item.primary || undefined,
                    accessRole: item.accessRole!,
                    backgroundColor: item.backgroundColor || undefined,
                })) || []
            );
        } catch (error) {
            throw new Error(
                `Failed to list calendars: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    // getEvents is a method that gets the events for a given calendar.
    async getEvents(
        calendarId: string,
        timeMin: string,
        timeMax: string,
    ): Promise<calendar_v3.Schema$Event[]> {
        try {
            await this.ensureUserAuth();
            const response = await this.calendar.events.list({
                calendarId,
                timeMin,
                timeMax,
                singleEvents: true,
                orderBy: 'startTime',
            });

            return response.data.items || [];
        } catch (error) {
            throw new Error(
                `Failed to get events: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    // createEvent is a method that creates an event for a given calendar.
    async createEvent(calendarId: string, event: CalendarEvent): Promise<calendar_v3.Schema$Event> {
        try {
            await this.ensureUserAuth();
            const response = await this.calendar.events.insert({
                calendarId,
                requestBody: event,
                conferenceDataVersion: event.conferenceData ? 1 : 0,
            });

            return response.data;
        } catch (error) {
            throw new Error(
                `Failed to create event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    // updateEvent is a method that updates an event for a given calendar.
    async updateEvent(
        calendarId: string,
        eventId: string,
        event: Partial<CalendarEvent>,
    ): Promise<calendar_v3.Schema$Event> {
        try {
            await this.ensureUserAuth();
            const response = await this.calendar.events.update({
                calendarId,
                eventId,
                requestBody: event,
            });

            return response.data;
        } catch (error) {
            throw new Error(
                `Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    // deleteEvent is a method that deletes an event for a given calendar.
    async deleteEvent(calendarId: string, eventId: string): Promise<void> {
        try {
            await this.ensureUserAuth();
            await this.calendar.events.delete({
                calendarId,
                eventId,
            });
        } catch (error) {
            throw new Error(
                `Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    // checkAvailability is a method that checks the availability for a given calendar.
    async checkAvailability(
        calendarIds: string[],
        timeMin: string,
        timeMax: string,
    ): Promise<{ busy: Array<{ start: string; end: string }> }> {
        try {
            await this.ensureUserAuth();
            const response = await this.calendar.freebusy.query({
                requestBody: {
                    timeMin,
                    timeMax,
                    items: calendarIds.map((id) => ({ id })),
                },
            });

            const busyTimes: Array<{ start: string; end: string }> = [];

            Object.values(response.data.calendars || {}).forEach((calendar) => {
                calendar.busy?.forEach((period) => {
                    if (period.start && period.end) {
                        busyTimes.push({
                            start: period.start,
                            end: period.end,
                        });
                    }
                });
            });

            return { busy: busyTimes };
        } catch (error) {
            throw new Error(
                `Failed to check availability: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}
