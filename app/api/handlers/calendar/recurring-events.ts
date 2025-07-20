import { Context } from 'hono';
import { createCalendarService } from '@/services/calendar/service';
import { getUser } from './connections';

/**
 * Handle the POST request to create a recurring event in primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleCreateRecurringEventInPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const { event, sendUpdates, conferenceDataVersion } = await c.req.json();

        if (!event || !event.summary || !event.start || !event.end) {
            return c.json({ error: 'Event with summary, start, and end is required' }, 400);
        }

        if (
            !event.recurrence ||
            !Array.isArray(event.recurrence) ||
            event.recurrence.length === 0
        ) {
            return c.json({ error: 'Recurrence rules are required for recurring events' }, 400);
        }

        // Validate that each recurrence rule has the required freq property
        for (const rule of event.recurrence) {
            if (!rule.freq) {
                return c.json(
                    { error: 'Each recurrence rule must have a frequency (freq) property' },
                    400,
                );
            }
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.createRecurringEventInPrimaryCalendar(event, {
            sendUpdates,
            conferenceDataVersion,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error creating recurring event in primary calendar:', error);
        return c.json({ error: 'Failed to create recurring event in primary calendar' }, 500);
    }
}

/**
 * Handle the POST request to create a recurring event in a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleCreateRecurringEvent(c: Context) {
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

        if (
            !event.recurrence ||
            !Array.isArray(event.recurrence) ||
            event.recurrence.length === 0
        ) {
            return c.json({ error: 'Recurrence rules are required for recurring events' }, 400);
        }

        // Validate that each recurrence rule has the required freq property
        for (const rule of event.recurrence) {
            if (!rule.freq) {
                return c.json(
                    { error: 'Each recurrence rule must have a frequency (freq) property' },
                    400,
                );
            }
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.createRecurringEvent(calendarId, event, {
            sendUpdates,
            conferenceDataVersion,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error creating recurring event in calendar:', error);
        return c.json({ error: 'Failed to create recurring event in calendar' }, 500);
    }
}

/**
 * Handle the PATCH request to update a recurring event in primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdateRecurringEventInPrimaryCalendar(c: Context) {
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

        const result = await calendarService.updateRecurringEventInPrimaryCalendar(eventId, event, {
            sendUpdates,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error updating recurring event in primary calendar:', error);
        return c.json({ error: 'Failed to update recurring event in primary calendar' }, 500);
    }
}

/**
 * Handle the PATCH request to update a recurring event in a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdateRecurringEvent(c: Context) {
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

        const result = await calendarService.updateRecurringEvent(calendarId, eventId, event, {
            sendUpdates,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error updating recurring event in calendar:', error);
        return c.json({ error: 'Failed to update recurring event in calendar' }, 500);
    }
}

/**
 * Handle the DELETE request to delete a recurring event from primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleDeleteRecurringEventFromPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const eventId = c.req.param('eventId');
        const { sendUpdates } = await c.req.json();

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.deleteRecurringEventFromPrimaryCalendar(eventId, {
            sendUpdates,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error deleting recurring event from primary calendar:', error);
        return c.json({ error: 'Failed to delete recurring event from primary calendar' }, 500);
    }
}

/**
 * Handle the DELETE request to delete a recurring event from a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleDeleteRecurringEvent(c: Context) {
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

        await calendarService.deleteRecurringEvent(calendarId, eventId, {
            sendUpdates,
        });

        return c.json({ success: true, message: 'Recurring event deleted successfully' });
    } catch (error) {
        console.error('Error deleting recurring event from calendar:', error);
        return c.json({ error: 'Failed to delete recurring event from calendar' }, 500);
    }
}

/**
 * Handle the GET request to get a recurring event from primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetRecurringEventFromPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const eventId = c.req.param('eventId');
        const query = c.req.query();

        const { timeZone, alwaysIncludeEmail, maxAttendees } = query;

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.getRecurringEventFromPrimaryCalendar(eventId, {
            timeZone: timeZone || undefined,
            alwaysIncludeEmail: alwaysIncludeEmail ? alwaysIncludeEmail === 'true' : undefined,
            maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error getting recurring event from primary calendar:', error);
        return c.json({ error: 'Failed to get recurring event from primary calendar' }, 500);
    }
}

/**
 * Handle the GET request to get a recurring event from a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetRecurringEvent(c: Context) {
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

        const result = await calendarService.getRecurringEvent(calendarId, eventId, {
            timeZone: timeZone || undefined,
            alwaysIncludeEmail: alwaysIncludeEmail ? alwaysIncludeEmail === 'true' : undefined,
            maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error getting recurring event from calendar:', error);
        return c.json({ error: 'Failed to get recurring event from calendar' }, 500);
    }
}

/**
 * Handle the PATCH request to reschedule a recurring event in primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleRescheduleRecurringEventInPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const eventId = c.req.param('eventId');
        const { startDateTime, endDateTime, timeZone, sendUpdates } = await c.req.json();

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        if (!startDateTime || !endDateTime || !timeZone) {
            return c.json({ error: 'startDateTime, endDateTime, and timeZone are required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.rescheduleRecurringEventInPrimaryCalendar(
            eventId,
            startDateTime,
            endDateTime,
            timeZone,
            {
                sendUpdates,
            },
        );

        return c.json(result);
    } catch (error) {
        console.error('Error rescheduling recurring event in primary calendar:', error);
        return c.json({ error: 'Failed to reschedule recurring event in primary calendar' }, 500);
    }
}

/**
 * Handle the PATCH request to reschedule a recurring event in a specific calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleRescheduleRecurringEvent(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const eventId = c.req.param('eventId');
        const { startDateTime, endDateTime, timeZone, sendUpdates } = await c.req.json();

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        if (!startDateTime || !endDateTime || !timeZone) {
            return c.json({ error: 'startDateTime, endDateTime, and timeZone are required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.rescheduleRecurringEvent(
            calendarId,
            eventId,
            startDateTime,
            endDateTime,
            timeZone,
            {
                sendUpdates,
            },
        );

        return c.json(result);
    } catch (error) {
        console.error('Error rescheduling recurring event in calendar:', error);
        return c.json({ error: 'Failed to reschedule recurring event in calendar' }, 500);
    }
}

/**
 * Handle the PATCH request to update a specific instance of a recurring event
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdateRecurringEventInstance(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const eventId = c.req.param('eventId');
        const { instanceStartTime, updates, sendUpdates } = await c.req.json();

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        if (!instanceStartTime) {
            return c.json({ error: 'instanceStartTime is required' }, 400);
        }

        if (!updates) {
            return c.json({ error: 'updates are required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.updateRecurringEventInstance(
            calendarId,
            eventId,
            instanceStartTime,
            updates,
            {
                sendUpdates,
            },
        );

        return c.json(result);
    } catch (error) {
        console.error('Error updating recurring event instance:', error);
        return c.json({ error: 'Failed to update recurring event instance' }, 500);
    }
}

/**
 * Handle the PATCH request to update future instances of a recurring event
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdateFutureRecurringEvents(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const eventId = c.req.param('eventId');
        const { fromDateTime, updates, sendUpdates } = await c.req.json();

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        if (!fromDateTime) {
            return c.json({ error: 'fromDateTime is required' }, 400);
        }

        if (!updates) {
            return c.json({ error: 'updates are required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.updateFutureRecurringEvents(
            calendarId,
            eventId,
            fromDateTime,
            updates,
            {
                sendUpdates,
            },
        );

        return c.json(result);
    } catch (error) {
        console.error('Error updating future recurring events:', error);
        return c.json({ error: 'Failed to update future recurring events' }, 500);
    }
}

/**
 * Handle the DELETE request to delete a specific instance of a recurring event
 * @param c - The context object
 * @returns The response object
 */
export async function handleDeleteRecurringEventInstance(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const eventId = c.req.param('eventId');
        const { instanceStartTime, sendUpdates } = await c.req.json();

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        if (!instanceStartTime) {
            return c.json({ error: 'instanceStartTime is required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        await calendarService.deleteRecurringEventInstance(calendarId, eventId, instanceStartTime, {
            sendUpdates,
        });

        return c.json({ success: true, message: 'Recurring event instance deleted successfully' });
    } catch (error) {
        console.error('Error deleting recurring event instance:', error);
        return c.json({ error: 'Failed to delete recurring event instance' }, 500);
    }
}

/**
 * Handle the POST request to batch create recurring events in primary calendar
 * @param c - The context object
 * @returns The response object
 */
export async function handleBatchCreateRecurringEventsInPrimaryCalendar(c: Context) {
    try {
        const user = getUser(c);
        const { events, sendUpdates, conferenceDataVersion } = await c.req.json();

        if (!events || !Array.isArray(events) || events.length === 0) {
            return c.json({ error: 'events array is required and must not be empty' }, 400);
        }

        // Validate each event
        for (const event of events) {
            if (!event || !event.summary || !event.start || !event.end) {
                return c.json({ error: 'Each event must have summary, start, and end' }, 400);
            }

            if (
                !event.recurrence ||
                !Array.isArray(event.recurrence) ||
                event.recurrence.length === 0
            ) {
                return c.json({ error: 'Each event must have recurrence rules' }, 400);
            }

            // Validate that each recurrence rule has the required freq property
            for (const rule of event.recurrence) {
                if (!rule.freq) {
                    return c.json(
                        { error: 'Each recurrence rule must have a frequency (freq) property' },
                        400,
                    );
                }
            }
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.batchCreateRecurringEventsInPrimaryCalendar(events, {
            sendUpdates,
            conferenceDataVersion,
        });

        return c.json(result);
    } catch (error) {
        console.error('Error batch creating recurring events in primary calendar:', error);
        return c.json(
            { error: 'Failed to batch create recurring events in primary calendar' },
            500,
        );
    }
}

/**
 * Handle the GET request to get recurring event instances
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetRecurringEventInstances(c: Context) {
    try {
        const user = getUser(c);
        const calendarId = c.req.param('calendarId');
        const eventId = c.req.param('eventId');
        const query = c.req.query();

        const { timeMin, timeMax, maxResults, pageToken, timeZone, showDeleted } = query;

        if (!calendarId) {
            return c.json({ error: 'calendarId is required' }, 400);
        }

        if (!eventId) {
            return c.json({ error: 'eventId is required' }, 400);
        }

        if (!timeMin || !timeMax) {
            return c.json({ error: 'timeMin and timeMax are required' }, 400);
        }

        const calendarService = createCalendarService(user.id);

        const result = await calendarService.getRecurringEventInstances(
            calendarId,
            eventId,
            timeMin,
            timeMax,
            {
                maxResults: maxResults ? parseInt(maxResults, 10) : undefined,
                pageToken: pageToken || undefined,
                timeZone: timeZone || undefined,
                showDeleted: showDeleted ? showDeleted === 'true' : undefined,
            },
        );

        return c.json(result);
    } catch (error) {
        console.error('Error getting recurring event instances:', error);
        return c.json({ error: 'Failed to get recurring event instances' }, 500);
    }
}
