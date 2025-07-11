import { Context } from 'hono';
import { db } from '@/db';
import { availability } from '@/db/schema/availability';
import { eq, and } from 'drizzle-orm';

export const getUser = (c: Context) => {
    const user = c.get('user');
    if (!user) {
        throw new Error('User not found in context');
    }
    return user;
};

/**
 * Handle GET request to fetch user availability
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetAvailability(c: Context) {
    try {
        const user = getUser(c);

        const userAvailability = await db
            .select({
                id: availability.id,
                days: availability.days,
                startTime: availability.startTime,
                endTime: availability.endTime,
                timezone: availability.timezone,
                isActive: availability.isActive,
                createdAt: availability.createdAt,
                updatedAt: availability.updatedAt,
            })
            .from(availability)
            .where(and(eq(availability.userId, user.id), eq(availability.isActive, true)))
            .orderBy(availability.createdAt);

        return c.json(userAvailability);
    } catch (error) {
        console.error('Error fetching availability:', error);
        return c.json({ error: 'Failed to fetch availability' }, 500);
    }
}

/**
 * Handle POST request to create new availability
 * @param c - The context object
 * @returns The response object
 */
export async function handleCreateAvailability(c: Context) {
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

        const newAvailability = await db
            .insert(availability)
            .values({
                userId: user.id,
                days: body.days,
                startTime: body.startTime,
                endTime: body.endTime,
                timezone: body.timezone || 'America/New_York',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return c.json(newAvailability[0], 201);
    } catch (error) {
        console.error('Error creating availability:', error);
        return c.json({ error: 'Failed to create availability' }, 500);
    }
}

/**
 * Handle PATCH request to update availability
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdateAvailability(c: Context) {
    try {
        const user = getUser(c);
        const availabilityId = c.req.param('id');
        const body = await c.req.json();

        // Check if availability exists and belongs to user
        const existingAvailability = await db
            .select()
            .from(availability)
            .where(
                and(
                    eq(availability.id, parseInt(availabilityId)),
                    eq(availability.userId, user.id),
                ),
            )
            .limit(1);

        if (existingAvailability.length === 0) {
            return c.json({ error: 'Availability not found' }, 404);
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

        const updatedAvailability = await db
            .update(availability)
            .set({
                days: body.days,
                startTime: body.startTime,
                endTime: body.endTime,
                timezone: body.timezone,
                isActive: body.isActive,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(availability.id, parseInt(availabilityId)),
                    eq(availability.userId, user.id),
                ),
            )
            .returning();

        return c.json(updatedAvailability[0]);
    } catch (error) {
        console.error('Error updating availability:', error);
        return c.json({ error: 'Failed to update availability' }, 500);
    }
}

/**
 * Handle DELETE request to delete availability
 * @param c - The context object
 * @returns The response object
 */
export async function handleDeleteAvailability(c: Context) {
    try {
        const user = getUser(c);
        const availabilityId = c.req.param('id');

        // Check if availability exists and belongs to user
        const existingAvailability = await db
            .select()
            .from(availability)
            .where(
                and(
                    eq(availability.id, parseInt(availabilityId)),
                    eq(availability.userId, user.id),
                ),
            )
            .limit(1);

        if (existingAvailability.length === 0) {
            return c.json({ error: 'Availability not found' }, 404);
        }

        // Soft delete - mark as inactive
        await db
            .update(availability)
            .set({
                isActive: false,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(availability.id, parseInt(availabilityId)),
                    eq(availability.userId, user.id),
                ),
            );

        return c.json({ success: true });
    } catch (error) {
        console.error('Error deleting availability:', error);
        return c.json({ error: 'Failed to delete availability' }, 500);
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

        // Get user's availability for the specific day
        const userAvailability = await db
            .select()
            .from(availability)
            .where(and(eq(availability.userId, user.id), eq(availability.isActive, true)));

        // Check if user has availability on this day
        const availableSlots = userAvailability.filter(
            (slot) => slot.days && slot.days.includes(dayOfWeek),
        );

        if (availableSlots.length === 0) {
            return c.json({
                available: false,
                reason: 'No availability set for this day',
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
