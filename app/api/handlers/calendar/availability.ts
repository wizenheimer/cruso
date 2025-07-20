import { Context } from 'hono';
import { createCalendarService } from '@/services/calendar/service';
import { getUser } from './connections';
import { db } from '@/db';
import { calendarConnections } from '@/db/schema/calendars';
import { eq, and } from 'drizzle-orm';

/**
 * Handle the GET request to check availability
 * @param c - The context object
 * @returns The response object
 */
export async function handleCheckAvailability(c: Context) {
    try {
        const user = getUser(c);
        const { startTime, endTime, timeDurationMinutes, responseTimezone } = await c.req.json();

        if (!startTime || !endTime) {
            return c.json({ error: 'startTime and endTime are required' }, 400);
        }

        // Use calendar service to check availability
        const calendarService = createCalendarService(user.id);

        const availabilityResult = await calendarService.checkAvailabilityBlock(
            startTime,
            endTime,
            {
                timeDurationMinutes: timeDurationMinutes,
                responseTimezone: responseTimezone,
            },
        );

        const allEvents = availabilityResult.events;

        // Sort events by start time
        allEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

        // Get the actual number of calendars checked
        const activeConnections = await db
            .select()
            .from(calendarConnections)
            .where(
                and(
                    eq(calendarConnections.userId, user.id),
                    eq(calendarConnections.includeInAvailability, true),
                    eq(calendarConnections.isActive, true),
                ),
            );

        return c.json({
            availabilityResult: availabilityResult,
            calendarsChecked: activeConnections.length,
        });
    } catch (error) {
        console.error('Error checking availability:', error);
        return c.json({ error: 'Failed to check availability' }, 500);
    }
}

/**
 * Handle the POST request to block availability
 * @param c - The context object
 * @returns The response object
 */
export async function handleBlockAvailability(c: Context) {
    try {
        const user = getUser(c);
        const {
            startTime,
            endTime,
            timeDurationMinutes,
            eventSummary,
            eventDescription,
            eventAttendees,
            eventLocation,
            eventConference,
            eventPrivate,
        } = await c.req.json();

        if (!startTime || !endTime) {
            return c.json({ error: 'startTime and endTime are required' }, 400);
        }

        // Use calendar service to check availability
        const calendarService = createCalendarService(user.id);

        const createAvailabilityBlockResult = await calendarService.createAvailabilityBlock(
            startTime,
            endTime,
            {
                timeDurationMinutes: timeDurationMinutes,
                eventSummary: eventSummary,
                eventDescription: eventDescription,
                eventAttendees: eventAttendees,
                eventLocation: eventLocation,
                eventConference: eventConference,
                eventPrivate: eventPrivate,
            },
        );

        console.log('Availability blocked successfully', createAvailabilityBlockResult);

        return c.json({
            createAvailabilityBlockResult: createAvailabilityBlockResult,
        });
    } catch (error) {
        console.error('Error blocking availability:', error);
        return c.json({ error: 'Failed to block availability' }, 500);
    }
}
