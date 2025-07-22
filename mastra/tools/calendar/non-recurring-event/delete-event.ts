import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { deleteEventInputSchema, deleteEventOutputSchema } from '@/types/tools/non-recurring-event';

export const deleteEventTool = createTool({
    id: 'delete-event',
    description: 'Delete an event from google calendar for the current user',
    inputSchema: deleteEventInputSchema,
    outputSchema: deleteEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        const { options } = context;

        try {
            const calendarService = new GoogleCalendarService(user.id);

            const result = await calendarService.deleteEventFromPrimaryCalendar(options);

            return {
                state: result.state,
            };
        } catch (error) {
            console.error('Failed to delete event:', error);
            return {
                state: 'failed' as const,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    },
});
