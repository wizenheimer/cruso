import { db } from '@/db';
import { workingHours } from '@/db/schema/working-hours';
import { eq, and } from 'drizzle-orm';

export interface CreateWorkingHoursResult {
    success: boolean;
    data?: any;
    error?: string;
}

export class WorkingHoursService {
    /**
     * Create default 9-5 weekday working hours for a new user
     * @param userId - The user ID to create working hours for
     * @returns Result indicating success or failure
     */
    async createDefaultWorkingHours(userId: string): Promise<CreateWorkingHoursResult> {
        try {
            // Default 9-5 working hours for weekdays (Monday = 1, Tuesday = 2, ..., Friday = 5)
            const defaultWorkingHours = await db
                .insert(workingHours)
                .values({
                    userId,
                    days: [1, 2, 3, 4, 5], // Monday to Friday (0=Sunday, 1=Monday, 2=Tuesday, etc.)
                    startTime: '09:00:00', // 9:00 AM
                    endTime: '17:00:00', // 5:00 PM
                    timezone: 'America/New_York', // Default timezone
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            return {
                success: true,
                data: defaultWorkingHours[0],
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Get all working hours slots for a user
     * @param userId - The user ID to get working hours for
     * @returns Array of working hours slots
     */
    async getUserWorkingHours(userId: string) {
        try {
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
                .where(eq(workingHours.userId, userId))
                .orderBy(workingHours.createdAt);

            return {
                success: true,
                data: userWorkingHours,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Create a new working hours slot for a user
     * @param userId - The user ID
     * @param workingHoursData - The working hours data
     * @returns Result indicating success or failure
     */
    async createWorkingHours(
        userId: string,
        workingHoursData: {
            days: number[];
            startTime: string;
            endTime: string;
            timezone?: string;
        },
    ): Promise<CreateWorkingHoursResult> {
        try {
            const newWorkingHours = await db
                .insert(workingHours)
                .values({
                    userId,
                    days: workingHoursData.days,
                    startTime: workingHoursData.startTime,
                    endTime: workingHoursData.endTime,
                    timezone: workingHoursData.timezone || 'America/New_York',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            return {
                success: true,
                data: newWorkingHours[0],
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Update an existing working hours slot
     * @param userId - The user ID
     * @param workingHoursId - The working hours ID to update
     * @param workingHoursData - The updated working hours data
     * @returns Result indicating success or failure
     */
    async updateWorkingHours(
        userId: string,
        workingHoursId: number,
        workingHoursData: Partial<{
            days: number[];
            startTime: string;
            endTime: string;
            timezone: string;
        }>,
    ): Promise<CreateWorkingHoursResult> {
        try {
            const updatedWorkingHours = await db
                .update(workingHours)
                .set({
                    ...workingHoursData,
                    updatedAt: new Date(),
                })
                .where(and(eq(workingHours.id, workingHoursId), eq(workingHours.userId, userId)))
                .returning();

            if (updatedWorkingHours.length === 0) {
                return {
                    success: false,
                    error: 'Working hours not found or does not belong to user',
                };
            }

            return {
                success: true,
                data: updatedWorkingHours[0],
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Delete a working hours slot (hard delete)
     * @param userId - The user ID
     * @param workingHoursId - The working hours ID to delete
     * @returns Result indicating success or failure
     */
    async deleteWorkingHours(
        userId: string,
        workingHoursId: number,
    ): Promise<CreateWorkingHoursResult> {
        try {
            // Check if working hours exists and belongs to user
            const existingWorkingHours = await db
                .select()
                .from(workingHours)
                .where(and(eq(workingHours.id, workingHoursId), eq(workingHours.userId, userId)))
                .limit(1);

            if (existingWorkingHours.length === 0) {
                return {
                    success: false,
                    error: 'Working hours not found or does not belong to user',
                };
            }

            // Hard delete - permanently remove the record
            const [deletedWorkingHours] = await db
                .delete(workingHours)
                .where(and(eq(workingHours.id, workingHoursId), eq(workingHours.userId, userId)))
                .returning();

            return {
                success: true,
                data: deletedWorkingHours,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
}
