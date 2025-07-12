import { db } from '@/db';
import { availability } from '@/db/schema/availability';
import { eq, and } from 'drizzle-orm';

/**
 * Get all availability slots for a user
 */
export async function getUserAvailability(userId: string) {
    return db
        .select({
            id: availability.id,
            days: availability.days,
            startTime: availability.startTime,
            endTime: availability.endTime,
            timezone: availability.timezone,
            createdAt: availability.createdAt,
            updatedAt: availability.updatedAt,
        })
        .from(availability)
        .where(eq(availability.userId, userId))
        .orderBy(availability.createdAt);
}

/**
 * Get a specific availability slot by ID
 */
export async function getAvailabilityById(availabilityId: number, userId: string) {
    const result = await db
        .select()
        .from(availability)
        .where(and(eq(availability.id, availabilityId), eq(availability.userId, userId)))
        .limit(1);

    return result[0] || null;
}

/**
 * Create a new availability slot
 */
export async function createAvailability(data: {
    userId: string;
    days: number[];
    startTime: string;
    endTime: string;
    timezone?: string;
}) {
    const [newAvailability] = await db
        .insert(availability)
        .values({
            userId: data.userId,
            days: data.days,
            startTime: data.startTime,
            endTime: data.endTime,
            timezone: data.timezone || 'America/New_York',
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning();

    return newAvailability;
}

/**
 * Update an existing availability slot
 */
export async function updateAvailability(
    availabilityId: number,
    userId: string,
    data: Partial<{
        days: number[];
        startTime: string;
        endTime: string;
        timezone: string;
    }>,
) {
    const [updatedAvailability] = await db
        .update(availability)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(and(eq(availability.id, availabilityId), eq(availability.userId, userId)))
        .returning();

    return updatedAvailability;
}

/**
 * Delete an availability slot (hard delete)
 */
export async function deleteAvailability(availabilityId: number, userId: string) {
    // Check if availability exists and belongs to user
    const existingAvailability = await db
        .select()
        .from(availability)
        .where(and(eq(availability.id, availabilityId), eq(availability.userId, userId)))
        .limit(1);

    if (existingAvailability.length === 0) {
        return null;
    }

    // Hard delete - permanently remove the record
    const [deletedAvailability] = await db
        .delete(availability)
        .where(and(eq(availability.id, availabilityId), eq(availability.userId, userId)))
        .returning();

    return deletedAvailability;
}

/**
 * Check if user has any availability slots
 */
export async function hasAvailability(userId: string) {
    const result = await db
        .select({ count: availability.id })
        .from(availability)
        .where(eq(availability.userId, userId))
        .limit(1);

    return result.length > 0;
}
