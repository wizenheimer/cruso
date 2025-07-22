import { Context } from 'hono';
import { createCalendarService } from '@/services/calendar/service';
import { getUser } from './connections';
import type { CalendarEvent } from '@/types/services';

/**
 * Handle the GET request to list events from primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleListEventsFromPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const query = c.req.query();

        const {
            timeMin,
            timeMax,
            maxResults,
            pageToken,
            q,
            showDeleted,
            singleEvents,
            orderBy,
            timeZone,
            alwaysIncludeEmail,
            maxAttendees,
            syncToken,
            updatedMin,
            iCalUID,
        } = query;

        if (!timeMin || !timeMax) {
            return c.json({ error: 'timeMin and timeMax are required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.listEventsFromPrimaryCalendar({
            timeMin,
            timeMax,
            maxResults: maxResults ? parseInt(maxResults, 10) : undefined,
            pageToken,
            q,
            showDeleted: showDeleted ? showDeleted === 'true' : undefined,
            singleEvents: singleEvents ? singleEvents === 'true' : undefined,
            orderBy: orderBy as 'startTime' | 'updated' | undefined,
            timeZone: timeZone || undefined,
            alwaysIncludeEmail: alwaysIncludeEmail ? alwaysIncludeEmail === 'true' : undefined,
            maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
            syncToken: syncToken || undefined,
            updatedMin: updatedMin || undefined,
            iCalUID: iCalUID || undefined,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error listing events from primary calendar:', error);
        return c.json({ error: 'Failed to list events from primary calendar' }, 500);
    }
}

/**
 * Handle the POST request to create an event in primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleCreateEventInPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const { event, sendUpdates, conferenceDataVersion } = await c.req.json();

        if (!event || !event.summary || !event.start || !event.end) {
            return c.json({ error: 'Event with summary, start, and end is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.createEventInPrimaryCalendar(event, {
            sendUpdates,
            conferenceDataVersion,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error creating event in primary calendar:', error);
        return c.json({ error: 'Failed to create event in primary calendar' }, 500);
    }
}

/**
 * Handle the PATCH request to update an event in primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdateEventInPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const eventId = c.req.param('eventId');
        const { event, sendUpdates } = await c.req.json();

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        if (!event) {
            return c.json({ error: 'Event data is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.updateEventInPrimaryCalendar(eventId, event, {
            sendUpdates,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error updating event in primary calendar:', error);
        return c.json({ error: 'Failed to update event in primary calendar' }, 500);
    }
}

/**
 * Handle the PATCH request to reschedule an event in primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleRescheduleEventInPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const eventId = c.req.param('eventId');
        const { startDateTime, endDateTime, timeZone } = await c.req.json();

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.rescheduleEventInPrimaryCalendar(
            eventId,
            startDateTime,
            endDateTime,
            timeZone,
        );

        return c.json(result);
    } catch (error) {
        console.error('Error rescheduling event in primary calendar:', error);
        return c.json({ error: 'Failed to reschedule event in primary calendar' }, 500);
    }
}

/**
 * Handle the DELETE request to delete an event from primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleDeleteEventFromPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const eventId = c.req.param('eventId');
        const { sendUpdates } = await c.req.json();

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.deleteEventFromPrimaryCalendar(eventId, {
            sendUpdates,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error deleting event from primary calendar:', error);
        return c.json({ error: 'Failed to delete event from primary calendar' }, 500);
    }
}

/**
 * Handle the POST request to quick create an event in primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleQuickCreateEventInPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const {
            summary,
            startDateTime,
            endDateTime,
            description,
            location,
            attendees,
            sendUpdates,
            conferenceDataVersion,
            createConference,
            colorId,
            reminders,
        } = await c.req.json();

        if (!summary || !startDateTime || !endDateTime) {
            return c.json({ error: 'summary, startDateTime, and endDateTime are required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.quickCreateEventInPrimaryCalendar(
            summary,
            startDateTime,
            endDateTime,
            {
                description,
                location,
                attendees,
                sendUpdates,
                conferenceDataVersion,
                createConference,
                colorId,
                reminders,
            },
        );

        return c.json(result);
    } catch (error) {
        console.error('Error quick creating event in primary calendar:', error);
        return c.json({ error: 'Failed to quick create event in primary calendar' }, 500);
    }
}

/**
 * Handle the POST request to perform batch operations on primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handlePerformBatchOperationsOnPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const { operations, sendUpdates } = await c.req.json();

        if (!operations || !Array.isArray(operations) || operations.length === 0) {
            return c.json({ error: 'operations array is required and must not be empty' }, 400);
        }

        // Validate operations structure
        for (const operation of operations) {
            if (!operation.type || !['create', 'update', 'delete'].includes(operation.type)) {
                return c.json(
                    { error: 'Each operation must have a valid type (create, update, delete)' },
                    400,
                );
            }

            if (operation.type === 'create' && !operation.event) {
                return c.json({ error: 'Create operations require event data' }, 400);
            }

            if (operation.type === 'update' && (!operation.eventId || !operation.event)) {
                return c.json({ error: 'Update operations require eventId and event data' }, 400);
            }

            if (operation.type === 'delete' && !operation.eventId) {
                return c.json({ error: 'Delete operations require eventId' }, 400);
            }
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.performBatchOperationsOnPrimaryCalendar(operations, {
            sendUpdates,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error performing batch operations on primary calendar:', error);
        return c.json({ error: 'Failed to perform batch operations on primary calendar' }, 500);
    }
}

/**
 * Handle the GET request to list events from a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleListEvents(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const timeMin = c.req.query('timeMin');
        const timeMax = c.req.query('timeMax');
        const maxResults = c.req.query('maxResults');
        const pageToken = c.req.query('pageToken');
        const q = c.req.query('q');
        const showDeleted = c.req.query('showDeleted');
        const singleEvents = c.req.query('singleEvents');
        const orderBy = c.req.query('orderBy');
        const timeZone = c.req.query('timeZone');
        const alwaysIncludeEmail = c.req.query('alwaysIncludeEmail');
        const maxAttendees = c.req.query('maxAttendees');
        const syncToken = c.req.query('syncToken');
        const updatedMin = c.req.query('updatedMin');
        const iCalUID = c.req.query('iCalUID');

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        if (!timeMin || !timeMax) {
            return c.json({ error: 'timeMin and timeMax are required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.listEvents(calendarId, {
            timeMin,
            timeMax,
            maxResults: maxResults ? parseInt(maxResults) : undefined,
            pageToken: pageToken || undefined,
            q: q || undefined,
            showDeleted: showDeleted ? showDeleted === 'true' : undefined,
            singleEvents: singleEvents ? singleEvents === 'true' : undefined,
            orderBy: orderBy as 'startTime' | 'updated' | undefined,
            timeZone: timeZone || undefined,
            alwaysIncludeEmail: alwaysIncludeEmail ? alwaysIncludeEmail === 'true' : undefined,
            maxAttendees: maxAttendees ? parseInt(maxAttendees) : undefined,
            syncToken: syncToken || undefined,
            updatedMin: updatedMin || undefined,
            iCalUID: iCalUID || undefined,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error listing events from calendar:', error);
        return c.json({ error: 'Failed to list events from calendar' }, 500);
    }
}

/**
 * Handle the POST request to create an event in a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleCreateEvent(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const { event, sendUpdates, conferenceDataVersion } = await c.req.json();

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        if (!event || !event.summary || !event.start || !event.end) {
            return c.json({ error: 'Event with summary, start, and end is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.createEvent(calendarId, event, {
            sendUpdates,
            conferenceDataVersion,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error creating event in calendar:', error);
        return c.json({ error: 'Failed to create event in calendar' }, 500);
    }
}

/**
 * Handle the PATCH request to update an event in a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdateEvent(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const eventId = c.req.param('eventId');
        const { event, sendUpdates } = await c.req.json();

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        if (!event) {
            return c.json({ error: 'Event data is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.updateEvent(calendarId, eventId, event, {
            sendUpdates,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error updating event in calendar:', error);
        return c.json({ error: 'Failed to update event in calendar' }, 500);
    }
}

/**
 * Handle the DELETE request to delete an event from a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleDeleteEvent(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const eventId = c.req.param('eventId');
        const { sendUpdates } = await c.req.json();

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        await calendarService.deleteEvent(calendarId, eventId, {
            sendUpdates,
        });

        return c.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event from calendar:', error);
        return c.json({ error: 'Failed to delete event from calendar' }, 500);
    }
}

/**
 * Handle the GET request to fetch a specific event from primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetEventFromPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const eventId = c.req.param('eventId');
        const query = c.req.query();

        const { timeZone, alwaysIncludeEmail, maxAttendees } = query;

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.getEventFromPrimaryCalendar({
            eventId,
            timeZone: timeZone || undefined,
            alwaysIncludeEmail: alwaysIncludeEmail ? alwaysIncludeEmail === 'true' : undefined,
            maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error getting event from primary calendar:', error);
        return c.json({ error: 'Failed to get event from primary calendar' }, 500);
    }
}

/**
 * Handle the GET request to fetch a specific event from a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetEvent(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const eventId = c.req.param('eventId');
        const query = c.req.query();

        const { timeZone, alwaysIncludeEmail, maxAttendees } = query;

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.getEvent(calendarId, {
            eventId,
            timeZone: timeZone || undefined,
            alwaysIncludeEmail: alwaysIncludeEmail ? alwaysIncludeEmail === 'true' : undefined,
            maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error getting event from calendar:', error);
        return c.json({ error: 'Failed to get event from calendar' }, 500);
    }
}

/**
 * Handle the GET request to find events by iCalUID across all calendars
 * @param c - The context object
 * @returns The response object
 */
export async function handleFindEventsByICalUID(c: Context) {
    try {
        const user = getUser(c);
        const query = c.req.query();

        const { iCalUID, timeZone, includeDeleted } = query;

        if (!iCalUID) {
            return c.json({ error: 'iCalUID is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.findEventsByICalUID(iCalUID, {
            timeZone: timeZone || undefined,
            includeDeleted: includeDeleted ? includeDeleted === 'true' : undefined,
        });

        // Convert Map to object for JSON serialization
        const eventsByCalendar: Record<string, CalendarEvent[]> = {};
        result.forEach((events, calendarId) => {
            eventsByCalendar[calendarId] = events;
        });

        return c.json({
            iCalUID,
            eventsByCalendar,
            totalCalendars: result.size,
            totalEvents: Array.from(result.values()).reduce(
                (sum, events) => sum + events.length,
                0,
            ),
        });
    } catch (error) {
        console.error('Error finding events by iCalUID:', error);
        return c.json({ error: 'Failed to find events by iCalUID' }, 500);
    }
}
