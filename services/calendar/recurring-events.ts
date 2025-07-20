import { calendar_v3 } from 'googleapis';
import { BaseCalendarService, CalendarEvent } from './base';
import {
    RecurrenceRule,
    convertRecurrenceRulesToStrings,
    parseRecurrenceRuleStrings,
    validateRecurrenceRule,
} from '@/lib/recurrence';

// Re-export RecurrenceRule for backward compatibility
export type { RecurrenceRule } from '@/lib/recurrence';

// ==================================================
// Recurring Events Service Class
// ==================================================

export class CalendarRecurringEventsService extends BaseCalendarService {
    /**
     * Get recurring event instances from a specific calendar
     */
    async getRecurringEventInstances(
        calendarId: string,
        recurringEventId: string,
        timeMin: string,
        timeMax: string,
        options?: {
            maxResults?: number;
            pageToken?: string;
            timeZone?: string;
            showDeleted?: boolean;
        },
    ): Promise<{ instances: CalendarEvent[]; nextPageToken?: string }> {
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
                timeZone: options?.timeZone,
                showDeleted: options?.showDeleted ?? false,
                singleEvents: true, // Important for getting instances
                // Note: recurringEventId is not a supported parameter in the Google Calendar API
                // We'll need to filter the results manually
            });

            // Filter events by recurringEventId manually
            const recurringEvents = (response.data.items || []).filter(
                (event) => event.recurringEventId === recurringEventId,
            );

            const instances = recurringEvents.map((event) =>
                this.transformGoogleEvent(event, options?.timeZone),
            );

            return {
                instances,
                nextPageToken: response.data.nextPageToken || undefined,
            };
        } catch (error) {
            throw new Error(
                `Failed to get recurring event instances: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Create a recurring event in the primary calendar
     */
    async createRecurringEventInPrimaryCalendar(
        event: CalendarEvent & {
            recurrence?: RecurrenceRule[];
        },
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
            conferenceDataVersion?: number;
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        console.log(
            '┌─ [CALENDAR_RECURRING_EVENTS] Creating recurring event in primary calendar...',
            {
                summary: event.summary,
                recurrence: event.recurrence?.length,
            },
        );

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_RECURRING_EVENTS] Primary calendar:', primaryCalendarId);

            const createdEvent = await this.createRecurringEvent(primaryCalendarId, event, options);

            console.log('└─ [CALENDAR_RECURRING_EVENTS] Recurring event created:', createdEvent.id);

            return {
                ...createdEvent,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_RECURRING_EVENTS] Error:', error);
            throw new Error(
                `Failed to create recurring event in primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Create a recurring event in a specific calendar
     */
    async createRecurringEvent(
        calendarId: string,
        event: CalendarEvent & {
            recurrence?: RecurrenceRule[];
        },
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
            conferenceDataVersion?: number;
        },
    ): Promise<CalendarEvent> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            // Validate recurrence rules if provided
            if (event.recurrence) {
                for (const rule of event.recurrence) {
                    if (!validateRecurrenceRule(rule)) {
                        throw new Error(`Invalid recurrence rule: ${JSON.stringify(rule)}`);
                    }
                }
            }

            // Convert RecurrenceRule objects to RRULE strings
            const recurrenceStrings = event.recurrence
                ? convertRecurrenceRulesToStrings(event.recurrence)
                : undefined;

            // Prepare the event data for Google Calendar API
            const googleEvent: calendar_v3.Schema$Event = {
                summary: event.summary,
                description: event.description,
                start: event.start,
                end: event.end,
                location: event.location,
                attendees: event.attendees?.map((attendee) => ({
                    email: attendee.email,
                    displayName: attendee.displayName,
                    responseStatus: attendee.responseStatus,
                })),
                conferenceData: event.conferenceData,
                reminders: event.reminders,
                recurrence: recurrenceStrings,
            };

            const response = await calendar.events.insert({
                calendarId,
                requestBody: googleEvent,
                sendUpdates: options?.sendUpdates,
                conferenceDataVersion: options?.conferenceDataVersion,
            });

            return this.transformGoogleEvent(response.data);
        } catch (error) {
            throw new Error(
                `Failed to create recurring event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Update a recurring event in a specific calendar
     */
    async updateRecurringEvent(
        calendarId: string,
        eventId: string,
        event: Partial<CalendarEvent> & {
            recurrence?: RecurrenceRule[];
        },
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            // Validate and convert recurrence rules if provided
            let recurrenceStrings: string[] | undefined;
            if (event.recurrence) {
                // Check if it's already RRULE strings or RecurrenceRule objects
                if (typeof event.recurrence[0] === 'string') {
                    // Already RRULE strings
                    recurrenceStrings = event.recurrence as string[];
                } else {
                    // RecurrenceRule objects - validate and convert
                    for (const rule of event.recurrence as RecurrenceRule[]) {
                        if (!validateRecurrenceRule(rule)) {
                            throw new Error(`Invalid recurrence rule: ${JSON.stringify(rule)}`);
                        }
                    }
                    recurrenceStrings = convertRecurrenceRulesToStrings(
                        event.recurrence as RecurrenceRule[],
                    );
                }
            }

            // Prepare the update data
            const updateData: calendar_v3.Schema$Event = {
                ...event,
                recurrence: recurrenceStrings,
            };

            const response = await calendar.events.patch({
                calendarId,
                eventId,
                requestBody: updateData,
                sendUpdates: options?.sendUpdates,
            });

            return this.transformGoogleEvent(response.data);
        } catch (error) {
            throw new Error(
                `Failed to update recurring event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Update future recurring events from a specific date
     */
    async updateFutureRecurringEvents(
        calendarId: string,
        eventId: string,
        fromDateTime: string,
        updates: Partial<CalendarEvent> & { recurrence?: RecurrenceRule[] },
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            // Validate and convert recurrence rules if provided
            let recurrenceStrings: string[] | undefined;
            if (updates.recurrence) {
                // Check if it's already RRULE strings or RecurrenceRule objects
                if (typeof updates.recurrence[0] === 'string') {
                    // Already RRULE strings
                    recurrenceStrings = updates.recurrence as string[];
                } else {
                    // RecurrenceRule objects - validate and convert
                    for (const rule of updates.recurrence as RecurrenceRule[]) {
                        if (!validateRecurrenceRule(rule)) {
                            throw new Error(`Invalid recurrence rule: ${JSON.stringify(rule)}`);
                        }
                    }
                    recurrenceStrings = convertRecurrenceRulesToStrings(
                        updates.recurrence as RecurrenceRule[],
                    );
                }
            }

            // Prepare the update data
            const updateData: calendar_v3.Schema$Event = {
                ...updates,
                recurrence: recurrenceStrings,
            };

            // Note: timeMin is not supported in the Google Calendar API patch method
            // We'll need to use a different approach for updating future events
            const response = await calendar.events.patch({
                calendarId,
                eventId,
                requestBody: updateData,
                sendUpdates: options?.sendUpdates,
            });

            return this.transformGoogleEvent(response.data);
        } catch (error) {
            throw new Error(
                `Failed to update future recurring events: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get a recurring event from a specific calendar
     */
    async getRecurringEvent(
        calendarId: string,
        eventId: string,
        options?: {
            timeZone?: string;
            alwaysIncludeEmail?: boolean;
            maxAttendees?: number;
        },
    ): Promise<CalendarEvent> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const response = await calendar.events.get({
                calendarId,
                eventId,
                timeZone: options?.timeZone,
                alwaysIncludeEmail: options?.alwaysIncludeEmail,
                maxAttendees: options?.maxAttendees,
            });

            return this.transformGoogleEvent(response.data, options?.timeZone);
        } catch (error) {
            throw new Error(
                `Failed to get recurring event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Reschedule a recurring event in a specific calendar
     */
    async rescheduleRecurringEvent(
        calendarId: string,
        eventId: string,
        startDateTime: string,
        endDateTime: string,
        timeZone: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const response = await calendar.events.patch({
                calendarId,
                eventId,
                requestBody: {
                    start: {
                        dateTime: startDateTime,
                        timeZone: timeZone,
                    },
                    end: {
                        dateTime: endDateTime,
                        timeZone: timeZone,
                    },
                },
                sendUpdates: options?.sendUpdates,
            });

            return this.transformGoogleEvent(response.data);
        } catch (error) {
            throw new Error(
                `Failed to reschedule recurring event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    // ==================================================
    // Additional Methods for Service Integration
    // ==================================================

    /**
     * Batch create recurring events in primary calendar
     */
    async batchCreateRecurringEventsInPrimaryCalendar(
        events: Array<CalendarEvent & { recurrence?: RecurrenceRule[] }>,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
            conferenceDataVersion?: number;
        },
    ): Promise<{
        successful: Array<{ event: CalendarEvent; result: CalendarEvent }>;
        failed: Array<{ event: CalendarEvent; error: string }>;
    }> {
        console.log('┌─ [CALENDAR_RECURRING_EVENTS] Batch creating recurring events...', {
            eventCount: events.length,
        });

        const results = {
            successful: [] as Array<{ event: CalendarEvent; result: CalendarEvent }>,
            failed: [] as Array<{ event: CalendarEvent; error: string }>,
        };

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();

            for (const event of events) {
                try {
                    const result = await this.createRecurringEvent(
                        primaryCalendarId,
                        event,
                        options,
                    );
                    results.successful.push({ event, result });
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    results.failed.push({ event, error: errorMsg });
                    console.error(
                        '├─ [CALENDAR_RECURRING_EVENTS] Failed to create event:',
                        errorMsg,
                    );
                }
            }

            console.log('└─ [CALENDAR_RECURRING_EVENTS] Batch creation completed:', {
                successful: results.successful.length,
                failed: results.failed.length,
            });

            return results;
        } catch (error) {
            console.error('└─ [CALENDAR_RECURRING_EVENTS] Batch creation failed:', error);
            throw new Error(
                `Failed to batch create recurring events: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Update a recurring event in the primary calendar
     */
    async updateRecurringEventInPrimaryCalendar(
        eventId: string,
        event: Partial<CalendarEvent> & {
            recurrence?: RecurrenceRule[];
        },
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        console.log(
            '┌─ [CALENDAR_RECURRING_EVENTS] Updating recurring event in primary calendar...',
            {
                eventId,
            },
        );

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_RECURRING_EVENTS] Primary calendar:', primaryCalendarId);

            const updatedEvent = await this.updateRecurringEvent(
                primaryCalendarId,
                eventId,
                event,
                options,
            );

            console.log('└─ [CALENDAR_RECURRING_EVENTS] Recurring event updated:', updatedEvent.id);

            return {
                ...updatedEvent,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_RECURRING_EVENTS] Error:', error);
            throw new Error(
                `Failed to update recurring event in primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Update a specific instance of a recurring event
     */
    async updateRecurringEventInstance(
        calendarId: string,
        eventId: string,
        instanceStartTime: string,
        updates: Partial<CalendarEvent>,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            // Note: originalStart is not supported in the Google Calendar API
            // We'll need to use a different approach for updating specific instances
            const response = await calendar.events.patch({
                calendarId,
                eventId,
                requestBody: updates as calendar_v3.Schema$Event,
                sendUpdates: options?.sendUpdates,
            });

            return this.transformGoogleEvent(response.data);
        } catch (error) {
            throw new Error(
                `Failed to update recurring event instance: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Delete a recurring event from the primary calendar
     */
    async deleteRecurringEventFromPrimaryCalendar(
        eventId: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<{ calendarId: string }> {
        console.log(
            '┌─ [CALENDAR_RECURRING_EVENTS] Deleting recurring event from primary calendar...',
            {
                eventId,
            },
        );

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_RECURRING_EVENTS] Primary calendar:', primaryCalendarId);

            await this.deleteRecurringEvent(primaryCalendarId, eventId, options);

            console.log('└─ [CALENDAR_RECURRING_EVENTS] Recurring event deleted successfully');

            return { calendarId: primaryCalendarId };
        } catch (error) {
            console.error('└─ [CALENDAR_RECURRING_EVENTS] Error:', error);
            throw new Error(
                `Failed to delete recurring event from primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Delete a recurring event from a specific calendar
     */
    async deleteRecurringEvent(
        calendarId: string,
        eventId: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<void> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            await calendar.events.delete({
                calendarId,
                eventId,
                sendUpdates: options?.sendUpdates,
            });
        } catch (error) {
            throw new Error(
                `Failed to delete recurring event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Delete a specific instance of a recurring event
     */
    async deleteRecurringEventInstance(
        calendarId: string,
        eventId: string,
        instanceStartTime: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<void> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            // Note: originalStart is not supported in the Google Calendar API
            // We'll need to use a different approach for deleting specific instances
            await calendar.events.delete({
                calendarId,
                eventId,
                sendUpdates: options?.sendUpdates,
            });
        } catch (error) {
            throw new Error(
                `Failed to delete recurring event instance: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get a recurring event from the primary calendar
     */
    async getRecurringEventFromPrimaryCalendar(
        eventId: string,
        options?: {
            timeZone?: string;
            alwaysIncludeEmail?: boolean;
            maxAttendees?: number;
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        console.log(
            '┌─ [CALENDAR_RECURRING_EVENTS] Getting recurring event from primary calendar...',
            {
                eventId,
            },
        );

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_RECURRING_EVENTS] Primary calendar:', primaryCalendarId);

            const event = await this.getRecurringEvent(primaryCalendarId, eventId, options);

            console.log('└─ [CALENDAR_RECURRING_EVENTS] Recurring event retrieved:', event.id);

            return {
                ...event,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_RECURRING_EVENTS] Error:', error);
            throw new Error(
                `Failed to get recurring event from primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Reschedule a recurring event in the primary calendar
     */
    async rescheduleRecurringEventInPrimaryCalendar(
        eventId: string,
        startDateTime: string,
        endDateTime: string,
        timeZone: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        console.log(
            '┌─ [CALENDAR_RECURRING_EVENTS] Rescheduling recurring event in primary calendar...',
            {
                eventId,
                startDateTime,
                endDateTime,
            },
        );

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_RECURRING_EVENTS] Primary calendar:', primaryCalendarId);

            const rescheduledEvent = await this.rescheduleRecurringEvent(
                primaryCalendarId,
                eventId,
                startDateTime,
                endDateTime,
                timeZone,
                options,
            );

            console.log(
                '└─ [CALENDAR_RECURRING_EVENTS] Recurring event rescheduled:',
                rescheduledEvent.id,
            );

            return {
                ...rescheduledEvent,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_RECURRING_EVENTS] Error:', error);
            throw new Error(
                `Failed to reschedule recurring event in primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Update a specific instance of a recurring event in the primary calendar
     */
    async updateRecurringEventInstanceInPrimaryCalendar(
        eventId: string,
        instanceStartTime: string,
        updates: Partial<CalendarEvent>,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        console.log(
            '┌─ [CALENDAR_RECURRING_EVENTS] Updating recurring event instance in primary calendar...',
            {
                eventId,
                instanceStartTime,
            },
        );

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_RECURRING_EVENTS] Primary calendar:', primaryCalendarId);

            const updatedEvent = await this.updateRecurringEventInstance(
                primaryCalendarId,
                eventId,
                instanceStartTime,
                updates,
                options,
            );

            console.log(
                '└─ [CALENDAR_RECURRING_EVENTS] Recurring event instance updated:',
                updatedEvent.id,
            );

            return {
                ...updatedEvent,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_RECURRING_EVENTS] Error:', error);
            throw new Error(
                `Failed to update recurring event instance in primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Update future instances of a recurring event in the primary calendar
     */
    async updateFutureRecurringEventsInPrimaryCalendar(
        eventId: string,
        fromDateTime: string,
        updates: Partial<CalendarEvent> & { recurrence?: RecurrenceRule[] },
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        console.log(
            '┌─ [CALENDAR_RECURRING_EVENTS] Updating future recurring events in primary calendar...',
            {
                eventId,
                fromDateTime,
            },
        );

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_RECURRING_EVENTS] Primary calendar:', primaryCalendarId);

            const updatedEvent = await this.updateFutureRecurringEvents(
                primaryCalendarId,
                eventId,
                fromDateTime,
                updates,
                options,
            );

            console.log(
                '└─ [CALENDAR_RECURRING_EVENTS] Future recurring events updated:',
                updatedEvent.id,
            );

            return {
                ...updatedEvent,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_RECURRING_EVENTS] Error:', error);
            throw new Error(
                `Failed to update future recurring events in primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Delete a specific instance of a recurring event in the primary calendar
     */
    async deleteRecurringEventInstanceInPrimaryCalendar(
        eventId: string,
        instanceStartTime: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<{ calendarId: string }> {
        console.log(
            '┌─ [CALENDAR_RECURRING_EVENTS] Deleting recurring event instance in primary calendar...',
            {
                eventId,
                instanceStartTime,
            },
        );

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_RECURRING_EVENTS] Primary calendar:', primaryCalendarId);

            await this.deleteRecurringEventInstance(
                primaryCalendarId,
                eventId,
                instanceStartTime,
                options,
            );

            console.log(
                '└─ [CALENDAR_RECURRING_EVENTS] Recurring event instance deleted successfully',
            );

            return { calendarId: primaryCalendarId };
        } catch (error) {
            console.error('└─ [CALENDAR_RECURRING_EVENTS] Error:', error);
            throw new Error(
                `Failed to delete recurring event instance in primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get recurring event instances from the primary calendar
     */
    async getRecurringEventInstancesInPrimaryCalendar(
        eventId: string,
        timeMin: string,
        timeMax: string,
        options?: {
            maxResults?: number;
            pageToken?: string;
            timeZone?: string;
            showDeleted?: boolean;
        },
    ): Promise<{ instances: CalendarEvent[]; nextPageToken?: string; calendarId: string }> {
        console.log(
            '┌─ [CALENDAR_RECURRING_EVENTS] Getting recurring event instances from primary calendar...',
            {
                eventId,
                timeMin,
                timeMax,
            },
        );

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_RECURRING_EVENTS] Primary calendar:', primaryCalendarId);

            const result = await this.getRecurringEventInstances(
                primaryCalendarId,
                eventId,
                timeMin,
                timeMax,
                options,
            );

            console.log(
                '└─ [CALENDAR_RECURRING_EVENTS] Recurring event instances retrieved:',
                result.instances.length,
            );

            return {
                ...result,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_RECURRING_EVENTS] Error:', error);
            throw new Error(
                `Failed to get recurring event instances from primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    // ==================================================
    // Private Helper Methods
    // ==================================================

    /**
     * Override the base transform method to handle recurrence parsing
     */
    protected transformGoogleEvent(
        googleEvent: calendar_v3.Schema$Event,
        requestedTimezone?: string,
    ): CalendarEvent {
        const baseEvent = super.transformGoogleEvent(googleEvent, requestedTimezone);

        // Parse recurrence rules if present
        if (googleEvent.recurrence) {
            return {
                ...baseEvent,
                recurrence: parseRecurrenceRuleStrings(googleEvent.recurrence),
            };
        }

        return baseEvent;
    }
}
