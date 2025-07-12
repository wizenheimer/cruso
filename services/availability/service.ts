import { db } from '@/db';
import { availability } from '@/db/schema/availability';
import { eq, and } from 'drizzle-orm';

export interface CreateAvailabilityResult {
    success: boolean;
    data?: any;
    error?: string;
}

export class AvailabilityService {
    /**
     * Create default 9-5 weekday availability for a new user
     * @param userId - The user ID to create availability for
     * @returns Result indicating success or failure
     */
    async createDefaultAvailability(userId: string): Promise<CreateAvailabilityResult> {
        try {
            console.log('[AVAILABILITY_SERVICE] Creating default availability for user:', userId);

            // Default 9-5 availability for weekdays (Monday = 1, Tuesday = 2, ..., Friday = 5)
            const defaultAvailability = await db
                .insert(availability)
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

            console.log(
                '[AVAILABILITY_SERVICE] Default availability created successfully:',
                defaultAvailability[0],
            );

            return {
                success: true,
                data: defaultAvailability[0],
            };
        } catch (error) {
            console.error('[AVAILABILITY_SERVICE] Error creating default availability:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Get all availability slots for a user
     * @param userId - The user ID to get availability for
     * @returns Array of availability slots
     */
    async getUserAvailability(userId: string) {
        try {
            const userAvailability = await db
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

            return {
                success: true,
                data: userAvailability,
            };
        } catch (error) {
            console.error('[AVAILABILITY_SERVICE] Error getting user availability:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Create a new availability slot for a user
     * @param userId - The user ID
     * @param availabilityData - The availability data
     * @returns Result indicating success or failure
     */
    async createAvailability(
        userId: string,
        availabilityData: {
            days: number[];
            startTime: string;
            endTime: string;
            timezone?: string;
        },
    ): Promise<CreateAvailabilityResult> {
        try {
            const newAvailability = await db
                .insert(availability)
                .values({
                    userId,
                    days: availabilityData.days,
                    startTime: availabilityData.startTime,
                    endTime: availabilityData.endTime,
                    timezone: availabilityData.timezone || 'America/New_York',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            return {
                success: true,
                data: newAvailability[0],
            };
        } catch (error) {
            console.error('[AVAILABILITY_SERVICE] Error creating availability:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Update an existing availability slot
     * @param userId - The user ID
     * @param availabilityId - The availability ID to update
     * @param availabilityData - The updated availability data
     * @returns Result indicating success or failure
     */
    async updateAvailability(
        userId: string,
        availabilityId: number,
        availabilityData: Partial<{
            days: number[];
            startTime: string;
            endTime: string;
            timezone: string;
        }>,
    ): Promise<CreateAvailabilityResult> {
        try {
            const updatedAvailability = await db
                .update(availability)
                .set({
                    ...availabilityData,
                    updatedAt: new Date(),
                })
                .where(and(eq(availability.id, availabilityId), eq(availability.userId, userId)))
                .returning();

            if (updatedAvailability.length === 0) {
                return {
                    success: false,
                    error: 'Availability not found or does not belong to user',
                };
            }

            return {
                success: true,
                data: updatedAvailability[0],
            };
        } catch (error) {
            console.error('[AVAILABILITY_SERVICE] Error updating availability:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }

    /**
     * Delete an availability slot (hard delete)
     * @param userId - The user ID
     * @param availabilityId - The availability ID to delete
     * @returns Result indicating success or failure
     */
    async deleteAvailability(
        userId: string,
        availabilityId: number,
    ): Promise<CreateAvailabilityResult> {
        try {
            // Check if availability exists and belongs to user
            const existingAvailability = await db
                .select()
                .from(availability)
                .where(and(eq(availability.id, availabilityId), eq(availability.userId, userId)))
                .limit(1);

            if (existingAvailability.length === 0) {
                return {
                    success: false,
                    error: 'Availability not found or does not belong to user',
                };
            }

            // Hard delete - permanently remove the record
            const [deletedAvailability] = await db
                .delete(availability)
                .where(and(eq(availability.id, availabilityId), eq(availability.userId, userId)))
                .returning();

            return {
                success: true,
                data: deletedAvailability,
            };
        } catch (error) {
            console.error('[AVAILABILITY_SERVICE] Error deleting availability:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
}
