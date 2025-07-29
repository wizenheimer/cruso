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
import { DateTime } from 'luxon';

export class EventsService extends BaseCalendarService {
    // ================================
    // List Events
    // ================================

    /**
     * Get events from the primary calendar
     */
    async listEventsFromPrimaryCalendar(options: ListEventsFromPrimaryCalendarOptions) {
        let formattedEventList = '';
        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            if (!primaryCalendarId) {
                throw new Error('Primary calendar not found');
            }
            const events = await this.listEventsFromAnyCalendar({
                ...options,
                calendarId: primaryCalendarId,
            });

            if (events.length === 0) {
                return 'No matching events found';
            }

            formattedEventList = `Found ${events.length} events:\n\n`;

            events.forEach((event, index) => {
                formattedEventList += this.formatEventWithDetails(event, primaryCalendarId);
                if (index < events.length - 1) {
                    formattedEventList += '\n\n';
                }
            });

            return formattedEventList;
        } catch (error) {
            console.error('Error listing events from primary calendar:', error);
            throw new Error(
                `Failed to list events from primary calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Get events from a specific calendar
     */
    async listEventsFromAnyCalendar(options: ListEventsFromAnyCalendarOptions) {
        try {
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

                console.log('Converting time range for event listing:', {
                    originalTimeMin: timeMin,
                    originalTimeMax: timeMax,
                    timezone: timezone,
                });

                timeMin = timeMin ? this.convertToRFC3339(timeMin, timezone) : undefined;
                timeMax = timeMax ? this.convertToRFC3339(timeMax, timezone) : undefined;

                console.log('Converted time range:', {
                    timeMin: timeMin,
                    timeMax: timeMax,
                });
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
        } catch (error) {
            console.error('Error listing events from calendar:', error);
            throw new Error(
                `Failed to list events from calendar ${options.calendarId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    // ================================
    // Create an Event
    // ================================

    /**
     * Create an event in the primary calendar
     */
    async createEventInPrimaryCalendar(options: CreateEventInPrimaryCalendarOptions) {
        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            if (!primaryCalendarId) {
                throw new Error('Primary calendar not found');
            }
            const event = await this.createEventFromAnyCalendar({
                ...options,
                calendarId: primaryCalendarId,
            });
            const formattedEvent = this.formatEventWithDetails(event, primaryCalendarId);
            return `Event created successfully:\n\n${formattedEvent}`;
        } catch (error) {
            console.error('Error creating event in primary calendar:', error);
            throw new Error(
                `Failed to create event in primary calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Create an event in a specific calendar
     */
    private async createEventFromAnyCalendar(options: CreateEventFromAnyCalendarOptions) {
        try {
            const connectionData = await this.getCalendarConnection(options.calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const timezone =
                options.timeZone ||
                (await this.getCalendarDefaultTimezone(options.calendarId, calendar));

            console.log('Creating event with timezone info:', {
                timezone: timezone,
                start: options.start,
                end: options.end,
            });

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

            console.log('Event creation request body:', JSON.stringify(requestBody, null, 2));

            const response = await calendar.events.insert({
                calendarId: options.calendarId,
                requestBody: requestBody,
            });
            if (!response.data) throw new Error('Failed to create event, no data returned');
            return response.data;
        } catch (error) {
            console.error('Error creating event in calendar:', error);
            throw new Error(
                `Failed to create event in calendar ${options.calendarId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    // ================================
    // Update an Event
    // ================================

    /**
     * Update an event in the primary calendar
     */
    async updateEventInPrimaryCalendar(options: UpdateEventInPrimaryCalendarOptions) {
        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            if (!primaryCalendarId) {
                throw new Error('Primary calendar not found');
            }
            const event = await this.updateEventFromAnyCalendar({
                ...options,
                calendarId: primaryCalendarId,
            });
            const formattedEvent = this.formatEventWithDetails(event, primaryCalendarId);
            return `Event updated successfully:\n\n${formattedEvent}`;
        } catch (error) {
            console.error('Error updating event in primary calendar:', error);
            throw new Error(
                `Failed to update event in primary calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Update an event in a specific calendar
     */
    private async updateEventFromAnyCalendar(options: UpdateEventFromAnyCalendarOptions) {
        try {
            const connectionData = await this.getCalendarConnection(options.calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const defaultTimeZone = await this.getCalendarDefaultTimezone(
                options.calendarId,
                calendar,
            );

            const eventType = await this.detectEventType(
                options.eventId,
                options.calendarId,
                calendar,
            );

            if (
                options.modificationScope &&
                options.modificationScope !== 'all' &&
                eventType !== 'recurring'
            ) {
                throw new Error('Scope other than "all" only applies to recurring events');
            }

            switch (options.modificationScope) {
                case 'thisEventOnly':
                    return await this.updateSingleInstance(options, defaultTimeZone, calendar);
                case 'all':
                case undefined:
                    return await this.updateAllInstances(options, defaultTimeZone, calendar);
                case 'thisAndFollowing':
                    return await this.updateFutureInstances(options, defaultTimeZone, calendar);
                default:
                    throw new Error(`Invalid modification scope: ${options.modificationScope}`);
            }
        } catch (error) {
            console.error('Error updating event in calendar:', error);
            throw new Error(
                `Failed to update event in calendar ${options.calendarId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    private async updateSingleInstance(
        options: UpdateEventFromAnyCalendarOptions,
        defaultTimeZone: string,
        calendar: calendar_v3.Calendar,
    ) {
        try {
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
        } catch (error) {
            console.error('Error updating single instance:', error);
            throw new Error(
                `Failed to update single instance: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    private async updateAllInstances(
        options: UpdateEventFromAnyCalendarOptions,
        defaultTimeZone: string,
        calendar: calendar_v3.Calendar,
    ) {
        try {
            const response = await calendar.events.patch({
                calendarId: options.calendarId,
                eventId: options.eventId,
                requestBody: this.buildUpdateRequestBody(options, defaultTimeZone),
            });

            if (!response.data) throw new Error('Failed to update event');
            return response.data;
        } catch (error) {
            console.error('Error updating all instances:', error);
            throw new Error(
                `Failed to update all instances: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    private async updateFutureInstances(
        options: UpdateEventFromAnyCalendarOptions,
        defaultTimeZone: string,
        calendar: calendar_v3.Calendar,
    ) {
        try {
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
                start: this.createTimeObject(
                    options.start || options.futureStartDate || '',
                    effectiveTimeZone,
                ),
                end: this.createTimeObject(endTime || '', effectiveTimeZone),
            };

            const response = await calendar.events.insert({
                calendarId: options.calendarId,
                requestBody: newEvent,
            });

            if (!response.data) throw new Error('Failed to create new recurring event');
            return response.data;
        } catch (error) {
            console.error('Error updating future instances:', error);
            throw new Error(
                `Failed to update future instances: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Cleans an event for duplication
     */
    cleanEventForDuplication(event: calendar_v3.Schema$Event): calendar_v3.Schema$Event {
        try {
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
        } catch (error) {
            console.error('Error cleaning event for duplication:', error);
            throw new Error(
                `Failed to clean event for duplication: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Calculates the UNTIL date for future instance updates using Luxon
     */
    private calculateUntilDate(futureStartDate: string): string {
        try {
            const futureDate = DateTime.fromISO(futureStartDate);
            if (!futureDate.isValid) {
                throw new Error(`Invalid future start date: ${futureDate.invalidReason}`);
            }

            const untilDate = futureDate.minus({ days: 1 });
            // Return in the required format: YYYYMMDDTHHMMSSZ
            return untilDate.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
        } catch (error) {
            console.error('Error calculating until date:', error);
            throw new Error(
                `Failed to calculate until date: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Calculates the end time for a new event using Luxon
     */
    private calculateEndTime(
        newStartTime: string,
        originalEvent: calendar_v3.Schema$Event,
    ): string {
        try {
            const newStart = DateTime.fromISO(newStartTime);
            const originalStart = DateTime.fromISO(originalEvent.start!.dateTime!);
            const originalEnd = DateTime.fromISO(originalEvent.end!.dateTime!);

            if (!newStart.isValid || !originalStart.isValid || !originalEnd.isValid) {
                throw new Error('Invalid datetime values for end time calculation');
            }

            const duration = originalEnd.diff(originalStart);
            const newEnd = newStart.plus(duration);

            return newEnd.toISO({ suppressMilliseconds: true }) || newStartTime;
        } catch (error) {
            console.error('Error calculating end time:', error);
            throw new Error(
                `Failed to calculate end time: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Updates the recurrence rule with a new UNTIL date
     */
    private updateRecurrenceWithUntil(recurrence: string[], untilDate: string): string[] {
        try {
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
        } catch (error) {
            console.error('Error updating recurrence with until date:', error);
            throw new Error(
                `Failed to update recurrence with until date: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Builds the request body for an event update
     */
    private buildUpdateRequestBody(args: any, defaultTimeZone?: string): calendar_v3.Schema$Event {
        try {
            const requestBody: calendar_v3.Schema$Event = {};

            if (args.summary !== undefined && args.summary !== null)
                requestBody.summary = args.summary;
            if (args.description !== undefined && args.description !== null)
                requestBody.description = args.description;
            if (args.location !== undefined && args.location !== null)
                requestBody.location = args.location;
            if (args.colorId !== undefined && args.colorId !== null)
                requestBody.colorId = args.colorId;
            if (args.attendees !== undefined && args.attendees !== null)
                requestBody.attendees = args.attendees;
            if (args.reminders !== undefined && args.reminders !== null)
                requestBody.reminders = args.reminders;
            if (args.recurrence !== undefined && args.recurrence !== null)
                requestBody.recurrence = args.recurrence;

            // Handle time changes
            let timeChanged = false;
            const effectiveTimeZone = args.timeZone || defaultTimeZone;

            console.log('Building update request body with timezone:', {
                effectiveTimeZone: effectiveTimeZone,
                start: args.start,
                end: args.end,
            });

            if (args.start !== undefined && args.start !== null) {
                requestBody.start = this.createTimeObject(args.start, effectiveTimeZone);
                timeChanged = true;
            }
            if (args.end !== undefined && args.end !== null) {
                requestBody.end = this.createTimeObject(args.end, effectiveTimeZone);
                timeChanged = true;
            }

            // Only add timezone objects if there were actual time changes, OR if neither start/end provided but timezone is given
            if (timeChanged || (!args.start && !args.end && effectiveTimeZone)) {
                if (!requestBody.start) requestBody.start = {};
                if (!requestBody.end) requestBody.end = {};
                if (!requestBody.start.timeZone) requestBody.start.timeZone = effectiveTimeZone;
                if (!requestBody.end.timeZone) requestBody.end.timeZone = effectiveTimeZone;
            }

            console.log('Final update request body:', JSON.stringify(requestBody, null, 2));
            return requestBody;
        } catch (error) {
            console.error('Error building update request body:', error);
            throw new Error(
                `Failed to build update request body: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Formats an instance ID for single instance updates using Luxon
     */
    private formatInstanceId(eventId: string, originalStartTime: string): string {
        try {
            const dt = DateTime.fromISO(originalStartTime);
            if (!dt.isValid) {
                throw new Error(`Invalid original start time: ${dt.invalidReason}`);
            }

            // Convert to UTC and format as YYYYMMDDTHHMMSSZ
            const basicTimeFormat = dt.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
            return `${eventId}_${basicTimeFormat}`;
        } catch (error) {
            console.error('Error formatting instance ID:', error);
            throw new Error(
                `Failed to format instance ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    // ================================
    // Delete an Event
    // ================================

    /**
     * Delete an event from the primary calendar
     */
    async deleteEventFromPrimaryCalendar(options: DeleteEventInPrimaryCalendarOptions) {
        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            if (!primaryCalendarId) {
                throw new Error('Primary calendar not found');
            }
            await this.deleteEventFromAnyCalendar({
                ...options,
                calendarId: primaryCalendarId,
            });
            return `Event with ID ${options.eventId} deleted successfully from primary calendar.`;
        } catch (error) {
            console.error('Error deleting event from primary calendar:', error);
            throw new Error(
                `Failed to delete event from primary calendar: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Delete an event from a specific calendar
     */
    private async deleteEventFromAnyCalendar(options: DeleteEventFromAnyCalendarOptions) {
        try {
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

            return `Event with ID ${options.eventId} deleted successfully from calendar ${options.calendarId}.`;
        } catch (error) {
            console.error('Error deleting event from calendar:', error);
            throw new Error(
                `Failed to delete event from calendar ${options.calendarId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}
