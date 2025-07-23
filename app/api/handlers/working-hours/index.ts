import { Context } from 'hono';
import { db } from '@/db';
import { workingHours } from '@/db/schema/working-hours';
import { eq, and } from 'drizzle-orm';

export const getUser = (c: Context) => {
    const user = c.get('user');
    if (!user) {
        throw new Error('User not found in context');
    }
    return user;
};

/**
 * Handle GET request to fetch user working hours
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetWorkingHours(c: Context) {
    try {
        const user = getUser(c);

        const userWorkingHours = await db
            .select({
                id: workingHours.id,
                days: workingHours.days,
                startTime: workingHours.startTime,
                endTime: workingHours.endTime,
                timezone: workingHours.timezone,
                createdAt: workingHours.createdAt,
                updatedAt: workingHours.updatedAt,
            })
            .from(workingHours)
            .where(eq(workingHours.userId, user.id))
            .orderBy(workingHours.createdAt);

        return c.json(userWorkingHours);
    } catch (error) {
        console.error('Error fetching working hours:', error);
        return c.json({ error: 'Failed to fetch working hours' }, 500);
    }
}

/**
 * Handle POST request to create new working hours
 * @param c - The context object
 * @returns The response object
 */
export async function handleCreateWorkingHours(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();

        if (!body.days || !Array.isArray(body.days) || body.days.length === 0) {
            return c.json({ error: 'Days array is required' }, 400);
        }

        if (!body.startTime || !body.endTime) {
            return c.json({ error: 'Start time and end time are required' }, 400);
        }

        // Validate days array contains valid day numbers (0-6)
        const validDays = body.days.every(
            (day: number) => Number.isInteger(day) && day >= 0 && day <= 6,
        );

        if (!validDays) {
            return c.json(
                { error: 'Days must be integers between 0 and 6 (Sunday to Saturday)' },
                400,
            );
        }

        const newWorkingHours = await db
            .insert(workingHours)
            .values({
                userId: user.id,
                days: body.days,
                startTime: body.startTime,
                endTime: body.endTime,
                timezone: body.timezone || 'America/New_York',
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return c.json(newWorkingHours[0], 201);
    } catch (error) {
        console.error('Error creating working hours:', error);
        return c.json({ error: 'Failed to create working hours' }, 500);
    }
}

/**
 * Handle PATCH request to update working hours
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdateWorkingHours(c: Context) {
    try {
        const user = getUser(c);
        const workingHoursId = c.req.param('id');
        const body = await c.req.json();

        // Check if working hours exists and belongs to user
        const existingWorkingHours = await db
            .select()
            .from(workingHours)
            .where(
                and(
                    eq(workingHours.id, parseInt(workingHoursId)),
                    eq(workingHours.userId, user.id),
                ),
            )
            .limit(1);

        if (existingWorkingHours.length === 0) {
            return c.json({ error: 'Working hours not found' }, 404);
        }

        // Validate days array if provided
        if (body.days && Array.isArray(body.days)) {
            const validDays = body.days.every(
                (day: number) => Number.isInteger(day) && day >= 0 && day <= 6,
            );

            if (!validDays) {
                return c.json(
                    { error: 'Days must be integers between 0 and 6 (Sunday to Saturday)' },
                    400,
                );
            }
        }

        const updatedWorkingHours = await db
            .update(workingHours)
            .set({
                days: body.days,
                startTime: body.startTime,
                endTime: body.endTime,
                timezone: body.timezone,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(workingHours.id, parseInt(workingHoursId)),
                    eq(workingHours.userId, user.id),
                ),
            )
            .returning();

        return c.json(updatedWorkingHours[0]);
    } catch (error) {
        console.error('Error updating working hours:', error);
        return c.json({ error: 'Failed to update working hours' }, 500);
    }
}

/**
 * Handle DELETE request to delete working hours
 * @param c - The context object
 * @returns The response object
 */
export async function handleDeleteWorkingHours(c: Context) {
    try {
        const user = getUser(c);
        const workingHoursId = c.req.param('id');

        // Check if working hours exists and belongs to user
        const existingWorkingHours = await db
            .select()
            .from(workingHours)
            .where(
                and(
                    eq(workingHours.id, parseInt(workingHoursId)),
                    eq(workingHours.userId, user.id),
                ),
            )
            .limit(1);

        if (existingWorkingHours.length === 0) {
            return c.json({ error: 'Working hours not found' }, 404);
        }

        // Hard delete - permanently remove the record
        await db
            .delete(workingHours)
            .where(
                and(
                    eq(workingHours.id, parseInt(workingHoursId)),
                    eq(workingHours.userId, user.id),
                ),
            );

        return c.json({ success: true });
    } catch (error) {
        console.error('Error deleting working hours:', error);
        return c.json({ error: 'Failed to delete working hours' }, 500);
    }
}

/**
 * Handle GET request to check if user is available at a specific time
 * @param c - The context object
 * @returns The response object
 */
export async function handleCheckUserAvailability(c: Context) {
    try {
        const user = getUser(c);
        const { date, time } = c.req.query();

        if (!date || !time) {
            return c.json({ error: 'Date and time are required' }, 400);
        }

        // Parse the date to get the day of week
        const requestDate = new Date(date as string);
        const dayOfWeek = requestDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Get user's working hours for the specific day
        const userWorkingHours = await db
            .select()
            .from(workingHours)
            .where(eq(workingHours.userId, user.id));

        // Check if user has working hours on this day
        const availableSlots = userWorkingHours.filter(
            (slot) => slot.days && slot.days.includes(dayOfWeek),
        );

        if (availableSlots.length === 0) {
            return c.json({
                available: false,
                reason: 'No working hours set for this day',
            });
        }

        // Check if the requested time falls within any available slot
        const requestTime = time as string;
        const isAvailable = availableSlots.some((slot) => {
            return requestTime >= slot.startTime && requestTime <= slot.endTime;
        });

        return c.json({
            available: isAvailable,
            availableSlots: availableSlots.map((slot) => ({
                startTime: slot.startTime,
                endTime: slot.endTime,
                timezone: slot.timezone,
            })),
        });
    } catch (error) {
        console.error('Error checking user availability:', error);
        return c.json({ error: 'Failed to check availability' }, 500);
    }
}
