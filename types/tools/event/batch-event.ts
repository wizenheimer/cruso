import z from 'zod';
import {
    batchOperationSchema,
    batchOperationsOptionsSchema,
    batchOperationResultSchema,
} from '@/types/services/events-schemas';

export const performBatchEventInputSchema = z.object({
    operations: z.array(batchOperationSchema).describe('Array of batch operations to perform'),
    options: batchOperationsOptionsSchema.optional().describe('Batch operation options'),
});

export const performBatchEventOutputSchema = batchOperationResultSchema;
