import {
    listEventsFromPrimaryCalendarResultSchema,
    listEventsOptionsSchema,
} from '@/types/services/events-schemas';
import z from 'zod';

/**
 * The input schema for the list events tool
 */
export const listEventsInputSchema = z.object({
    options: listEventsOptionsSchema,
});

/**
 * The output schema for the list events tool
 */
export const listEventsOutputSchema = z.object({
    result: listEventsFromPrimaryCalendarResultSchema.optional(),
    state: z.enum(['success', 'failed']).optional(),
    error: z.string().optional(),
});
