import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import {
    deleteRecurringEventInputSchema,
    deleteRecurringEventOutputSchema,
} from '@/types/tools/recurring-event';

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
