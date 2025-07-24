import { BaseCalendarService } from '@/services/calendar/base';
import {
    CreateEventInPrimaryCalendarOptions,
    CreateEventFromAnyCalendarOptions,
    ListEventsFromAnyCalendarOptions,
    ListEventsFromPrimaryCalendarOptions,
    UpdateEventInPrimaryCalendarOptions,
    UpdateEventFromAnyCalendarOptions,
    DeleteEventInPrimaryCalendarOptions,
    DeleteEventFromAnyCalendarOptions,
} from '@/types/tools/event';
import { calendar_v3 } from 'googleapis';

export class EventsService extends BaseCalendarService {
    // ================================
    // List Events
    // ================================

    /**
     * Get events from the primary calendar
     */
    async listEventsFromPrimaryCalendar(options: ListEventsFromPrimaryCalendarOptions) {
        const primaryCalendarId = await this.getPrimaryCalendarId();
        if (!primaryCalendarId) {
            throw new Error('Primary calendar not found');
        }
        return this.listEventsFromAnyCalendar({
            ...options,
            calendarId: primaryCalendarId,
        });
    }

    /**
     * Get events from a specific calendar
     */
    async listEventsFromAnyCalendar(options: ListEventsFromAnyCalendarOptions) {
        const connectionData = await this.getCalendarConnection(options.calendarId);
        if (!connectionData.account) {
            throw new Error('No account found for calendar connection');
        }

        const calendar = await this.getCalendarApi(connectionData.account.id);

        let timeMin = options.timeMin;
        let timeMax = options.timeMax;

        if (timeMin || timeMax) {
            const timezone =
                options.timeZone ||
                (await this.getCalendarDefaultTimezone(options.calendarId, calendar));
            timeMin = timeMin ? this.convertToRFC3339(timeMin, timezone) : undefined;
            timeMax = timeMax ? this.convertToRFC3339(timeMax, timezone) : undefined;
        }

        const response = await calendar.events.list({
            calendarId: options.calendarId,
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
        });

        return (response.data.items || []).map((event) => ({
            ...event,
            calendarId: options.calendarId,
        }));
    }

    // ================================
    // Create an Event
    // ================================

    /**
     * Create an event in the primary calendar
     */
    async createEventInPrimaryCalendar(options: CreateEventInPrimaryCalendarOptions) {
        const primaryCalendarId = await this.getPrimaryCalendarId();
        if (!primaryCalendarId) {
            throw new Error('Primary calendar not found');
        }
        return this.createEventFromAnyCalendar({
            ...options,
            calendarId: primaryCalendarId,
        });
    }

    /**
     * Create an event in a specific calendar
     */
    private async createEventFromAnyCalendar(options: CreateEventFromAnyCalendarOptions) {
        const connectionData = await this.getCalendarConnection(options.calendarId);
        if (!connectionData.account) {
            throw new Error('No account found for calendar connection');
        }

        const calendar = await this.getCalendarApi(connectionData.account.id);

        const timezone =
            options.timeZone ||
            (await this.getCalendarDefaultTimezone(options.calendarId, calendar));

        const requestBody: calendar_v3.Schema$Event = {
            summary: options.summary,
            description: options.description,
            start: this.createTimeObject(options.start, timezone),
            end: this.createTimeObject(options.end, timezone),
            attendees: options.attendees,
            location: options.location,
            colorId: options.colorId,
            reminders: options.reminders,
            recurrence: options.recurrence,
        };

        const response = await calendar.events.insert({
            calendarId: options.calendarId,
            requestBody: requestBody,
        });
        if (!response.data) throw new Error('Failed to create event, no data returned');
        return response.data;
    }

    // ================================
    // Update an Event
    // ================================

    /**
     * Update an event in the primary calendar
     */
    async updateEventInPrimaryCalendar(options: UpdateEventInPrimaryCalendarOptions) {
        const primaryCalendarId = await this.getPrimaryCalendarId();
        if (!primaryCalendarId) {
            throw new Error('Primary calendar not found');
        }
        return this.updateEventFromAnyCalendar({
            ...options,
            calendarId: primaryCalendarId,
        });
    }

    /**
     * Update an event in a specific calendar
     */
    private async updateEventFromAnyCalendar(options: UpdateEventFromAnyCalendarOptions) {
        const connectionData = await this.getCalendarConnection(options.calendarId);
        if (!connectionData.account) {
            throw new Error('No account found for calendar connection');
        }

        const calendar = await this.getCalendarApi(connectionData.account.id);

        const defaultTimeZone = await this.getCalendarDefaultTimezone(options.calendarId, calendar);

        const eventType = await this.detectEventType(options.eventId, options.calendarId, calendar);

        if (
            options.modificationScope &&
            options.modificationScope !== 'all' &&
            eventType !== 'recurring'
        ) {
            throw new Error('Scope other than "all" only applies to recurring events');
        }

        switch (options.modificationScope) {
            case 'thisEventOnly':
                return this.updateSingleInstance(options, defaultTimeZone, calendar);
            case 'all':
            case undefined:
                return this.updateAllInstances(options, defaultTimeZone, calendar);
            case 'thisAndFollowing':
                return this.updateFutureInstances(options, defaultTimeZone, calendar);
            default:
                throw new Error(`Invalid modification scope: ${options.modificationScope}`);
        }
    }

    private async updateSingleInstance(
        options: UpdateEventFromAnyCalendarOptions,
        defaultTimeZone: string,
        calendar: calendar_v3.Calendar,
    ) {
        if (!options.originalStartTime) {
            throw new Error('originalStartTime is required for single instance updates');
        }

        const instanceId = this.formatInstanceId(options.eventId, options.originalStartTime);

        const response = await calendar.events.patch({
            calendarId: options.calendarId,
            eventId: instanceId,
            requestBody: this.buildUpdateRequestBody(options, defaultTimeZone),
        });

        if (!response.data) throw new Error('Failed to update event, no data returned');
        return response.data;
    }

    private async updateAllInstances(
        options: UpdateEventFromAnyCalendarOptions,
        defaultTimeZone: string,
        calendar: calendar_v3.Calendar,
    ) {
        const response = await calendar.events.patch({
            calendarId: options.calendarId,
            eventId: options.eventId,
            requestBody: this.buildUpdateRequestBody(options, defaultTimeZone),
        });

        if (!response.data) throw new Error('Failed to update event');
        return response.data;
    }

    private async updateFutureInstances(
        options: UpdateEventFromAnyCalendarOptions,
        defaultTimeZone: string,
        calendar: calendar_v3.Calendar,
    ) {
        if (!options.futureStartDate) {
            throw new Error('futureStartDate is required for future instance updates');
        }

        const effectiveTimeZone = options.timeZone || defaultTimeZone;

        // 1. Get original event
        const originalResponse = await calendar.events.get({
            calendarId: options.calendarId,
            eventId: options.eventId,
        });
        const originalEvent = originalResponse.data;

        if (!originalEvent.recurrence) {
            throw new Error('Event does not have recurrence rules');
        }

        // 2. Calculate UNTIL date and update original event
        const untilDate = this.calculateUntilDate(options.futureStartDate);
        const updatedRecurrence = this.updateRecurrenceWithUntil(
            originalEvent.recurrence,
            untilDate,
        );

        await calendar.events.patch({
            calendarId: options.calendarId,
            eventId: options.eventId,
            requestBody: { recurrence: updatedRecurrence },
        });

        // 3. Create new recurring event starting from future date
        const requestBody = this.buildUpdateRequestBody(options, defaultTimeZone);

        // Calculate end time if start time is changing
        let endTime = options.end;
        if (options.start || options.futureStartDate) {
            const newStartTime = options.start || options.futureStartDate;
            endTime = endTime || this.calculateEndTime(newStartTime, originalEvent);
        }

        const newEvent = {
            ...this.cleanEventForDuplication(originalEvent),
            ...requestBody,
            start: {
                dateTime: options.start || options.futureStartDate,
                timeZone: effectiveTimeZone,
            },
            end: {
                dateTime: endTime,
                timeZone: effectiveTimeZone,
            },
        };

        const response = await calendar.events.insert({
            calendarId: options.calendarId,
            requestBody: newEvent,
        });

        if (!response.data) throw new Error('Failed to create new recurring event');
        return response.data;
    }

    /**
     * Cleans an event for duplication
     */
    cleanEventForDuplication(event: calendar_v3.Schema$Event): calendar_v3.Schema$Event {
        const cleanedEvent = { ...event };

        // Remove fields that shouldn't be duplicated
        delete cleanedEvent.id;
        delete cleanedEvent.etag;
        delete cleanedEvent.iCalUID;
        delete cleanedEvent.created;
        delete cleanedEvent.updated;
        delete cleanedEvent.htmlLink;
        delete cleanedEvent.hangoutLink;

        return cleanedEvent;
    }

    /**
     * Calculates the UNTIL date for future instance updates
     */
    private calculateUntilDate(futureStartDate: string): string {
        const futureDate = new Date(futureStartDate);
        const untilDate = new Date(futureDate.getTime() - 86400000); // -1 day
        return untilDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    /**
     * Calculates the end time for a new event
     */
    private calculateEndTime(
        newStartTime: string,
        originalEvent: calendar_v3.Schema$Event,
    ): string {
        const newStart = new Date(newStartTime);
        const originalStart = new Date(originalEvent.start!.dateTime!);
        const originalEnd = new Date(originalEvent.end!.dateTime!);
        const duration = originalEnd.getTime() - originalStart.getTime();

        return new Date(newStart.getTime() + duration).toISOString();
    }

    /**
     * Updates the recurrence rule with a new UNTIL date
     */
    private updateRecurrenceWithUntil(recurrence: string[], untilDate: string): string[] {
        if (!recurrence || recurrence.length === 0) {
            throw new Error('No recurrence rule found');
        }

        const updatedRecurrence: string[] = [];
        let foundRRule = false;

        for (const rule of recurrence) {
            if (rule.startsWith('RRULE:')) {
                foundRRule = true;
                const updatedRule =
                    rule
                        .replace(/;UNTIL=\d{8}T\d{6}Z/g, '') // Remove existing UNTIL
                        .replace(/;COUNT=\d+/g, '') + // Remove COUNT if present
                    `;UNTIL=${untilDate}`;
                updatedRecurrence.push(updatedRule);
            } else {
                // Preserve EXDATE, RDATE, and other rules as-is
                updatedRecurrence.push(rule);
            }
        }

        if (!foundRRule) {
            throw new Error('No RRULE found in recurrence rules');
        }

        return updatedRecurrence;
    }

    /**
     * Builds the request body for an event update
     * @param args - The options for the event update
     * @param defaultTimeZone - The default timezone for the event
     * @returns The request body for the event update
     */
    private buildUpdateRequestBody(args: any, defaultTimeZone?: string): calendar_v3.Schema$Event {
        const requestBody: calendar_v3.Schema$Event = {};

        if (args.summary !== undefined && args.summary !== null) requestBody.summary = args.summary;
        if (args.description !== undefined && args.description !== null)
            requestBody.description = args.description;
        if (args.location !== undefined && args.location !== null)
            requestBody.location = args.location;
        if (args.colorId !== undefined && args.colorId !== null) requestBody.colorId = args.colorId;
        if (args.attendees !== undefined && args.attendees !== null)
            requestBody.attendees = args.attendees;
        if (args.reminders !== undefined && args.reminders !== null)
            requestBody.reminders = args.reminders;
        if (args.recurrence !== undefined && args.recurrence !== null)
            requestBody.recurrence = args.recurrence;

        // Handle time changes
        let timeChanged = false;
        const effectiveTimeZone = args.timeZone || defaultTimeZone;

        if (args.start !== undefined && args.start !== null) {
            requestBody.start = { dateTime: args.start, timeZone: effectiveTimeZone };
            timeChanged = true;
        }
        if (args.end !== undefined && args.end !== null) {
            requestBody.end = { dateTime: args.end, timeZone: effectiveTimeZone };
            timeChanged = true;
        }

        // Only add timezone objects if there were actual time changes, OR if neither start/end provided but timezone is given
        if (timeChanged || (!args.start && !args.end && effectiveTimeZone)) {
            if (!requestBody.start) requestBody.start = {};
            if (!requestBody.end) requestBody.end = {};
            if (!requestBody.start.timeZone) requestBody.start.timeZone = effectiveTimeZone;
            if (!requestBody.end.timeZone) requestBody.end.timeZone = effectiveTimeZone;
        }

        return requestBody;
    }

    /**
     * Formats an instance ID for single instance updates
     */
    private formatInstanceId(eventId: string, originalStartTime: string): string {
        // Convert to UTC first, then format to basic format: YYYYMMDDTHHMMSSZ
        const utcDate = new Date(originalStartTime);
        const basicTimeFormat = utcDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        return `${eventId}_${basicTimeFormat}`;
    }

    // ================================
    // Delete an Event
    // ================================

    /**
     * Delete an event from the primary calendar
     */
    async deleteEventFromPrimaryCalendar(options: DeleteEventInPrimaryCalendarOptions) {
        const primaryCalendarId = await this.getPrimaryCalendarId();
        if (!primaryCalendarId) {
            throw new Error('Primary calendar not found');
        }
        return this.deleteEventFromAnyCalendar({
            ...options,
            calendarId: primaryCalendarId,
        });
    }

    /**
     * Delete an event from a specific calendar
     */
    private async deleteEventFromAnyCalendar(options: DeleteEventFromAnyCalendarOptions) {
        const connectionData = await this.getCalendarConnection(options.calendarId);
        if (!connectionData.account) {
            throw new Error('No account found for calendar connection');
        }

        const calendar = await this.getCalendarApi(connectionData.account.id);

        await calendar.events.delete({
            calendarId: options.calendarId,
            eventId: options.eventId,
            sendUpdates: options.sendUpdates,
        });
    }
}
