import z from 'zod';

/**
 * The input schema for the delete recurring event instance tool
 */
export const deleteRecurringEventInstanceInputSchema = z.object({
    eventId: z.string().describe('ID of the recurring event series'),
    instanceStartTime: z
        .string()
        .describe('Start time of the specific instance to delete (RFC3339 format)'),
    options: z
        .object({
            sendUpdates: z
                .enum(['all', 'externalOnly', 'none'])
                .optional()
                .describe('How to send updates to attendees'),
        })
        .optional()
        .describe('Delete event options'),
});

/**
 * The output schema for the delete recurring event instance tool
 */
export const deleteRecurringEventInstanceOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event instance deletion'),
    eventId: z.string().optional().describe('The id of the deleted recurring event instance'),
    instanceStartTime: z.string().optional().describe('The start time of the deleted instance'),
    calendarId: z
        .string()
        .optional()
        .describe('The calendar ID where the recurring event instance was deleted from'),
});
