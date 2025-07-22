import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import {
    deleteRecurringEventInstanceInputSchema,
    deleteRecurringEventInstanceOutputSchema,
} from '@/types/tools/recurring-event';

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
