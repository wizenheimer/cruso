import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { listEventsInputSchema, listEventsOutputSchema } from '@/types/tools/event';

/**
 * List upcoming events from google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The list of events
 */
export const listEventsTool = createTool({
    id: 'list-events',
    description: 'List upcoming events from google calendar for the current user',
    inputSchema: listEventsInputSchema,
    outputSchema: listEventsOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        const { options } = context;

        try {
            const calendarService = new GoogleCalendarService(user.id);

            const calendarEvents = await calendarService.listEventsFromPrimaryCalendar(options);

            return {
                result: calendarEvents,
                state: 'success' as const,
            };
        } catch (error) {
            console.error('Failed to list events:', error);
            return {
                state: 'failed' as const,
                error: error instanceof Error ? error.message : 'could not list events',
            };
        }
    },
});
