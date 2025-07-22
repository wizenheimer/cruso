import z from 'zod';
import { getEventOptionsSchema } from '@/types/services/events-schemas';
import { calendarEventSchema } from '@/types/services';

/**
 * The input schema for the get event tool
 */
export const getEventInputSchema = z.object({
    options: getEventOptionsSchema,
});

/**
 * The output schema for the get event tool
 */
export const getEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).optional(),
    result: calendarEventSchema.optional(),
    error: z.any().optional(),
});
