import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { getEventInputSchema, getEventOutputSchema } from '@/types/tools/non-recurring-event';

/**
 * Get a specific event from google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The retrieved event details
 */
export const getEventTool = createTool({
    id: 'get-event',
    description: 'Get a specific event from google calendar for the current user',
    inputSchema: getEventInputSchema,
    outputSchema: getEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        const { options } = context;

        try {
            const calendarService = new GoogleCalendarService(user.id);
            const event = await calendarService.getEventFromPrimaryCalendar(options);
            return {
                result: event,
                state: 'success' as const,
            };
        } catch (error) {
            console.error('Failed to get event:', error);
            return {
                state: 'failed' as const,
                error: error instanceof Error ? error.message : 'could not get requested event',
            };
        }
    },
});
