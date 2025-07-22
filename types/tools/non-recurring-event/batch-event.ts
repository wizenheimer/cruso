import z from 'zod';
import { calendarEventSchema } from './shared';

export const performBatchEventInputSchema = z.object({
    operations: z
        .array(
            z.object({
                type: z.enum(['create', 'update', 'delete']).describe('Operation type'),
                eventId: z
                    .string()
                    .optional()
                    .describe('Event ID (required for update and delete operations)'),
                event: calendarEventSchema
                    .optional()
                    .describe('Event data (required for create and update operations)'),
            }),
        )
        .describe('Array of batch operations to perform'),
    options: z
        .object({
            sendUpdates: z
                .enum(['all', 'externalOnly', 'none'])
                .optional()
                .describe('How to send updates to attendees'),
        })
        .optional()
        .describe('Batch operation options'),
});

export const performBatchEventOutputSchema = z.object({
    successful: z
        .array(
            z.object({
                operation: z
                    .object({
                        type: z.enum(['create', 'update', 'delete']).describe('Operation type'),
                        eventId: z.string().optional().describe('Event ID'),
                        event: calendarEventSchema.optional().describe('Event data'),
                    })
                    .describe('The operation that was performed'),
                result: z.any().optional().describe('Result of the operation'),
            }),
        )
        .describe('Successfully completed operations'),
    failed: z
        .array(
            z.object({
                operation: z
                    .object({
                        type: z.enum(['create', 'update', 'delete']).describe('Operation type'),
                        eventId: z.string().optional().describe('Event ID'),
                        event: calendarEventSchema.optional().describe('Event data'),
                    })
                    .describe('The operation that failed'),
                error: z.string().describe('Error message'),
            }),
        )
        .describe('Failed operations'),
});
