import z from 'zod';
import { deleteEventOptionsSchema, deleteResponseSchema } from '@/types/services/events-schemas';

export const deleteEventInputSchema = z.object({
    options: deleteEventOptionsSchema,
});

export const deleteEventOutputSchema = deleteResponseSchema;
