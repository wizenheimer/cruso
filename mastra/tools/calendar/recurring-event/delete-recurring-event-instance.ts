import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';

/**
 * The input schema for the delete recurring event instance tool
 */
const deleteRecurringEventInstanceInputSchema = z.object({
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
const deleteRecurringEventInstanceOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event instance deletion'),
    eventId: z.string().optional().describe('The id of the deleted recurring event instance'),
    instanceStartTime: z.string().optional().describe('The start time of the deleted instance'),
    calendarId: z
        .string()
        .optional()
        .describe('The calendar ID where the recurring event instance was deleted from'),
});

/**
 * Delete a specific instance of a recurring event in google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The deletion result details
 */
export const deleteRecurringEventInstanceTool = createTool({
    id: 'delete-recurring-event-instance',
    description:
        'Delete a specific instance of a recurring event in google calendar for the current user',
    inputSchema: deleteRecurringEventInstanceInputSchema,
    outputSchema: deleteRecurringEventInstanceOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { eventId, instanceStartTime, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log(
            'triggered delete recurring event instance tool',
            eventId,
            instanceStartTime,
            options,
            user,
        );

        try {
            const calendarService = new GoogleCalendarService(user.id);
            const result = await calendarService.deleteRecurringEventInstanceInPrimaryCalendar(
                eventId,
                instanceStartTime,
                options,
            );

            return {
                state: 'success' as const,
                eventId: eventId,
                instanceStartTime: instanceStartTime,
                calendarId: result.calendarId,
            };
        } catch (error) {
            console.error('Failed to delete recurring event instance:', error);
            return {
                state: 'failed' as const,
                eventId: eventId,
                instanceStartTime: instanceStartTime,
            };
        }
    },
});
