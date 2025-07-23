import { db } from '@/db';
import { workingHours } from '@/db/schema/working-hours';
import { eq, and } from 'drizzle-orm';

/**
 * Get all working hours slots for a user
 */
export async function getUserWorkingHours(userId: string) {
    return db
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
        .where(eq(workingHours.userId, userId))
        .orderBy(workingHours.createdAt);
}

/**
 * Get a specific working hours slot by ID
 */
export async function getWorkingHoursById(workingHoursId: number, userId: string) {
    const result = await db
        .select()
        .from(workingHours)
        .where(and(eq(workingHours.id, workingHoursId), eq(workingHours.userId, userId)))
        .limit(1);

    return result[0] || null;
}

/**
 * Create a new working hours slot
 */
export async function createWorkingHours(data: {
    userId: string;
    days: number[];
    startTime: string;
    endTime: string;
    timezone?: string;
}) {
    const [newWorkingHours] = await db
        .insert(workingHours)
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

    return newWorkingHours;
}

/**
 * Update an existing working hours slot
 */
export async function updateWorkingHours(
    workingHoursId: number,
    userId: string,
    data: Partial<{
        days: number[];
        startTime: string;
        endTime: string;
        timezone: string;
    }>,
) {
    const [updatedWorkingHours] = await db
        .update(workingHours)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(and(eq(workingHours.id, workingHoursId), eq(workingHours.userId, userId)))
        .returning();

    return updatedWorkingHours;
}

/**
 * Delete a working hours slot (hard delete)
 */
export async function deleteWorkingHours(workingHoursId: number, userId: string) {
    // Check if working hours exists and belongs to user
    const existingWorkingHours = await db
        .select()
        .from(workingHours)
        .where(and(eq(workingHours.id, workingHoursId), eq(workingHours.userId, userId)))
        .limit(1);

    if (existingWorkingHours.length === 0) {
        return null;
    }

    // Hard delete - permanently remove the record
    const [deletedWorkingHours] = await db
        .delete(workingHours)
        .where(and(eq(workingHours.id, workingHoursId), eq(workingHours.userId, userId)))
        .returning();

    return deletedWorkingHours;
}

/**
 * Check if user has any working hours slots
 */
export async function hasWorkingHours(userId: string) {
    const result = await db
        .select({ count: workingHours.id })
        .from(workingHours)
        .where(eq(workingHours.userId, userId))
        .limit(1);

    return result.length > 0;
}
