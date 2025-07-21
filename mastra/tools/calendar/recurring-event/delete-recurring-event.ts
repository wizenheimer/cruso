import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';

/**
 * The input schema for the delete recurring event tool
 */
const deleteRecurringEventInputSchema = z.object({
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
const deleteRecurringEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event deletion'),
    eventId: z.string().optional().describe('The id of the deleted recurring event'),
    calendarId: z
        .string()
        .optional()
        .describe('The calendar ID where the recurring event was deleted from'),
});

/**
 * Delete a recurring event from google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The deletion result
 */
export const deleteRecurringEventTool = createTool({
    id: 'delete-recurring-event',
    description: 'Delete a recurring event from google calendar for the current user',
    inputSchema: deleteRecurringEventInputSchema,
    outputSchema: deleteRecurringEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { eventId, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log('triggered delete recurring event tool', eventId, options, user);

        try {
            const calendarService = new GoogleCalendarService(user.id);

            const result = await calendarService.deleteRecurringEventFromPrimaryCalendar(
                eventId,
                options,
            );

            return {
                state: 'success' as const,
                eventId: eventId,
                calendarId: result.calendarId,
            };
        } catch (error) {
            console.error('Failed to delete recurring event:', error);
            return {
                state: 'failed' as const,
                eventId: eventId,
            };
        }
    },
});
