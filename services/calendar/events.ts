import { calendar_v3 } from 'googleapis';
import { BaseCalendarService } from './base';
import type { CalendarEvent } from '@/types/services';
import {
    GetEventsOptions,
    GetEventsResult,
    GetEventsFromPrimaryCalendarResult,
    GetEventOptions,
    GetEventFromPrimaryCalendarResult,
    FindEventsByICalUIDOptions,
    GetUpdatedEventsOptions,
    GetUpdatedEventsResult,
    CreateEventOptions,
    CreateEventInPrimaryCalendarResult,
    UpdateEventOptions,
    UpdateEventInPrimaryCalendarResult,
    DeleteEventOptions,
    DeleteEventFromPrimaryCalendarResult,
    RescheduleEventOptions,
    RescheduleEventInPrimaryCalendarResult,
    QuickCreateEventOptions,
    QuickCreateEventInPrimaryCalendarResult,
    BatchOperation,
    BatchOperationsOptions,
    BatchOperationResult,
} from '@/types/services';

export class CalendarEventsService extends BaseCalendarService {
    /**
     * Get events from the primary calendar
     */
    async getEventsFromPrimaryCalendar(
        timeMin: string,
        timeMax: string,
        options?: GetEventsOptions,
    ): Promise<GetEventsFromPrimaryCalendarResult> {
        console.log('┌─ [CALENDAR_EVENTS] Getting events from primary calendar...', {
            timeMin,
            timeMax,
        });

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_EVENTS] Primary calendar:', primaryCalendarId);

            const result = await this.getEvents(primaryCalendarId, timeMin, timeMax, options);

            console.log('└─ [CALENDAR_EVENTS] Retrieved events:', result.events.length);

            return {
                ...result,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_EVENTS] Error:', error);
            throw new Error(
                `Failed to get primary calendar events: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Get events from a specific calendar
     */
    async getEvents(
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

    /**
     * Get a specific event
     */
    async getEvent(
        calendarId: string,
        eventId: string,
        options?: GetEventOptions,
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
                `Failed to get event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Get a specific event from the primary calendar
     */
    async getEventFromPrimaryCalendar(
        eventId: string,
        options?: GetEventOptions,
    ): Promise<GetEventFromPrimaryCalendarResult> {
        console.log('┌─ [CALENDAR_EVENTS] Getting event from primary calendar...', { eventId });

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_EVENTS] Primary calendar:', primaryCalendarId);

            const event = await this.getEvent(primaryCalendarId, eventId, options);

            console.log('└─ [CALENDAR_EVENTS] Event retrieved:', event.id);

            return {
                ...event,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_EVENTS] Error:', error);
            throw new Error(
                `Failed to get event from primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Find events by iCalUID across all calendars
     */
    async findEventsByICalUID(
        iCalUID: string,
        options?: FindEventsByICalUIDOptions,
    ): Promise<Map<string, CalendarEvent[]>> {
        try {
            const connections = await this.getActiveConnections();
            const results = new Map<string, CalendarEvent[]>();

            for (const { connection, account } of connections) {
                if (!account) continue;

                try {
                    const calendar = await this.getCalendarApi(account.id);

                    const response = await calendar.events.list({
                        calendarId: connection.calendarId,
                        iCalUID,
                        showDeleted: options?.includeDeleted || false,
                        timeZone: options?.timeZone,
                    });

                    if (response.data.items && response.data.items.length > 0) {
                        const events = response.data.items.map((event) =>
                            this.transformGoogleEvent(event, options?.timeZone),
                        );
                        results.set(connection.calendarId, events);
                    }
                } catch (error) {
                    console.error(
                        `Error finding events in calendar ${connection.calendarId}:`,
                        error,
                    );
                }
            }

            return results;
        } catch (error) {
            throw new Error(
                `Failed to find events by iCalUID: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Get events that have been updated since a specific time
     */
    async getUpdatedEvents(
        calendarId: string,
        updatedMin: string,
        options?: GetUpdatedEventsOptions,
    ): Promise<GetUpdatedEventsResult> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const response = await calendar.events.list({
                calendarId,
                updatedMin,
                maxResults: options?.maxResults || 250,
                pageToken: options?.pageToken,
                syncToken: options?.syncToken,
                timeZone: options?.timeZone,
                showDeleted: true, // Important for sync operations
            });

            const events: CalendarEvent[] = [];
            const deletedEvents: string[] = [];

            for (const item of response.data.items || []) {
                if (item.status === 'cancelled') {
                    deletedEvents.push(item.id!);
                } else {
                    events.push(this.transformGoogleEvent(item, options?.timeZone));
                }
            }

            return {
                events,
                deletedEvents,
                nextPageToken: response.data.nextPageToken || undefined,
                nextSyncToken: response.data.nextSyncToken || undefined,
                lastSyncTime: new Date().toISOString(),
            };
        } catch (error) {
            throw new Error(
                `Failed to get updated events: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Create an event in the primary calendar
     */
    async createEventInPrimaryCalendar(
        event: CalendarEvent,
        options?: CreateEventOptions,
    ): Promise<CreateEventInPrimaryCalendarResult> {
        console.log('┌─ [CALENDAR_EVENTS] Creating event in primary calendar...', {
            summary: event.summary,
            start: event.start,
            end: event.end,
        });

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_EVENTS] Primary calendar:', primaryCalendarId);

            const createdEvent = await this.createEvent(primaryCalendarId, event, options);

            console.log('└─ [CALENDAR_EVENTS] Event created:', createdEvent.id);

            return {
                ...createdEvent,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_EVENTS] Error:', error);
            throw new Error(
                `Failed to create event in primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Create an event in a specific calendar
     */
    async createEvent(
        calendarId: string,
        event: CalendarEvent,
        options?: CreateEventOptions,
    ): Promise<CalendarEvent> {
        console.log('┌─ [CALENDAR_EVENTS] Creating event...', {
            calendarId,
            summary: event.summary,
        });
        try {
            console.log('├─ [CALENDAR_EVENTS] Getting calendar connection...');
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                console.log('└─ [CALENDAR_EVENTS] No account found for calendar connection');
                throw new Error('No account found for calendar connection');
            }
            console.log('├─ [CALENDAR_EVENTS] Account found, getting calendar API...');

            const calendar = await this.getCalendarApi(connectionData.account.id);

            console.log('├─ [CALENDAR_EVENTS] Inserting event into calendar...');
            const response = await calendar.events.insert({
                calendarId,
                requestBody: event as calendar_v3.Schema$Event,
                sendUpdates: options?.sendUpdates || 'none',
                conferenceDataVersion: options?.conferenceDataVersion,
            });

            console.log('└─ [CALENDAR_EVENTS] Event created successfully:', {
                eventId: response.data.id,
            });
            return this.transformGoogleEvent(response.data);
        } catch (error) {
            console.log('└─ [CALENDAR_EVENTS] Failed to create event:', error);
            throw new Error(
                `Failed to create event: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Update an event in the primary calendar
     */
    async updateEventInPrimaryCalendar(
        eventId: string,
        event: Partial<CalendarEvent>,
        options?: UpdateEventOptions,
    ): Promise<UpdateEventInPrimaryCalendarResult> {
        console.log('┌─ [CALENDAR_EVENTS] Updating event in primary calendar...', { eventId });

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_EVENTS] Primary calendar:', primaryCalendarId);

            const updatedEvent = await this.updateEvent(primaryCalendarId, eventId, event, options);

            console.log('└─ [CALENDAR_EVENTS] Event updated:', updatedEvent.id);

            return {
                ...updatedEvent,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_EVENTS] Error:', error);
            throw new Error(
                `Failed to update event in primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Update an event in a specific calendar
     */
    async updateEvent(
        calendarId: string,
        eventId: string,
        event: Partial<CalendarEvent>,
        options?: UpdateEventOptions,
    ): Promise<CalendarEvent> {
        try {
            const connectionData = await this.getCalendarConnection(calendarId);
            if (!connectionData.account) {
                throw new Error('No account found for calendar connection');
            }

            const calendar = await this.getCalendarApi(connectionData.account.id);

            const response = await calendar.events.update({
                calendarId,
                eventId,
                requestBody: event as calendar_v3.Schema$Event,
                sendUpdates: options?.sendUpdates,
            });

            return this.transformGoogleEvent(response.data);
        } catch (error) {
            throw new Error(
                `Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Delete an event from the primary calendar
     */
    async deleteEventFromPrimaryCalendar(
        eventId: string,
        options?: DeleteEventOptions,
    ): Promise<DeleteEventFromPrimaryCalendarResult> {
        console.log('┌─ [CALENDAR_EVENTS] Deleting event from primary calendar...', { eventId });

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_EVENTS] Primary calendar:', primaryCalendarId);

            await this.deleteEvent(primaryCalendarId, eventId, options);

            console.log('└─ [CALENDAR_EVENTS] Event deleted successfully');

            return { calendarId: primaryCalendarId };
        } catch (error) {
            console.error('└─ [CALENDAR_EVENTS] Error:', error);
            throw new Error(
                `Failed to delete event from primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Delete an event from a specific calendar
     */
    async deleteEvent(
        calendarId: string,
        eventId: string,
        options?: DeleteEventOptions,
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
                `Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Reschedule an event in the primary calendar
     */
    async rescheduleEventInPrimaryCalendar(
        eventId: string,
        startDateTime: string,
        endDateTime: string,
        timeZone: string,
        options?: RescheduleEventOptions,
    ): Promise<RescheduleEventInPrimaryCalendarResult> {
        console.log('┌─ [CALENDAR_EVENTS] Rescheduling event in primary calendar...', {
            eventId,
            startDateTime,
            endDateTime,
        });

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();
            console.log('├─ [CALENDAR_EVENTS] Primary calendar:', primaryCalendarId);

            const rescheduledEvent = await this.rescheduleEvent(
                primaryCalendarId,
                eventId,
                startDateTime,
                endDateTime,
                timeZone,
                options,
            );

            console.log('└─ [CALENDAR_EVENTS] Event rescheduled:', rescheduledEvent.id);

            return {
                ...rescheduledEvent,
                calendarId: primaryCalendarId,
            };
        } catch (error) {
            console.error('└─ [CALENDAR_EVENTS] Error:', error);
            throw new Error(
                `Failed to reschedule event in primary calendar: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    /**
     * Reschedule an event in a specific calendar
     */
    async rescheduleEvent(
        calendarId: string,
        eventId: string,
        startDateTime: string,
        endDateTime: string,
        timeZone: string,
        options?: RescheduleEventOptions,
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
                `Failed to reschedule event: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Quick create event in primary calendar with minimal parameters
     */
    async quickCreateEventInPrimaryCalendar(
        summary: string,
        startDateTime: string,
        endDateTime: string,
        options?: QuickCreateEventOptions,
    ): Promise<QuickCreateEventInPrimaryCalendarResult> {
        const event: CalendarEvent = {
            summary,
            description: options?.description,
            start: {
                dateTime: startDateTime,
            },
            end: {
                dateTime: endDateTime,
            },
            location: options?.location,
            attendees: options?.attendees?.map((email) => ({ email })),
            reminders: options?.reminders,
        };

        if (options?.createConference) {
            event.conferenceData = {
                createRequest: {
                    requestId: crypto.randomUUID(),
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet',
                    },
                },
            };
        }

        return this.createEventInPrimaryCalendar(event, {
            sendUpdates: options?.sendUpdates,
            conferenceDataVersion: options?.conferenceDataVersion,
        });
    }

    /**
     * Perform batch operations on primary calendar
     */
    async performBatchOperationsOnPrimaryCalendar(
        operations: BatchOperation[],
        options?: BatchOperationsOptions,
    ): Promise<BatchOperationResult> {
        console.log('┌─ [CALENDAR_EVENTS] Performing batch operations on primary calendar...', {
            operationCount: operations.length,
        });

        const results = {
            successful: [] as Array<{ operation: any; result?: any }>,
            failed: [] as Array<{ operation: any; error: string }>,
        };

        try {
            const primaryCalendarId = await this.getPrimaryCalendarId();

            for (const operation of operations) {
                try {
                    let result;
                    switch (operation.type) {
                        case 'create':
                            if (!operation.event) {
                                throw new Error('Event data required for create operation');
                            }
                            result = await this.createEvent(
                                primaryCalendarId,
                                operation.event as CalendarEvent,
                                options,
                            );
                            break;
                        case 'update':
                            if (!operation.eventId || !operation.event) {
                                throw new Error(
                                    'Event ID and event data required for update operation',
                                );
                            }
                            result = await this.updateEvent(
                                primaryCalendarId,
                                operation.eventId,
                                operation.event,
                                options,
                            );
                            break;
                        case 'delete':
                            if (!operation.eventId) {
                                throw new Error('Event ID required for delete operation');
                            }
                            await this.deleteEvent(primaryCalendarId, operation.eventId, options);
                            result = { deleted: true };
                            break;
                        default:
                            throw new Error(`Unknown operation type: ${operation.type}`);
                    }

                    results.successful.push({ operation, result });
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    results.failed.push({ operation, error: errorMsg });
                    console.error('├─ [CALENDAR_EVENTS] Batch operation failed:', {
                        operation,
                        error: errorMsg,
                    });
                }
            }

            console.log('└─ [CALENDAR_EVENTS] Batch operations completed:', {
                successful: results.successful.length,
                failed: results.failed.length,
            });

            return results;
        } catch (error) {
            console.error('└─ [CALENDAR_EVENTS] Batch operations failed:', error);
            throw new Error(
                `Failed to perform batch operations: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}
