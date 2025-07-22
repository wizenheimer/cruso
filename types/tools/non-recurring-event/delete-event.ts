import z from 'zod';

export const deleteEventInputSchema = z.object({
    eventId: z.string().describe('ID of the event to delete'),
    notifyAttendees: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to notify attendees of the deletion'),
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

export const deleteEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event deletion'),
    eventId: z.string().optional().describe('The id of the event deleted'),
    eventTitle: z.string().optional().describe('The title of the event deleted'),
    calendarId: z.string().optional().describe('The calendar ID where the event was deleted'),
});
