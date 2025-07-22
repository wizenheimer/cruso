import z from 'zod';

/**
 * The input schema for the delete recurring event tool
 */
export const deleteRecurringEventInputSchema = z.object({
    eventId: z.string().describe('ID of the recurring event to delete'),
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
 * The output schema for the delete recurring event tool
 */
export const deleteRecurringEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event deletion'),
    eventId: z.string().optional().describe('The id of the deleted recurring event'),
    calendarId: z
        .string()
        .optional()
        .describe('The calendar ID where the recurring event was deleted from'),
});
