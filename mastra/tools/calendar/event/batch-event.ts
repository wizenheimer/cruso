import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { createTool } from '@mastra/core/tools';
import { performBatchEventInputSchema, performBatchEventOutputSchema } from '@/types/tools/event';

export const performBatchEventTool = createTool({
    id: 'perform-batch-event',
    description:
        'Perform a batch of event operations (create, update, delete) in google calendar for the current user',
    inputSchema: performBatchEventInputSchema,
    outputSchema: performBatchEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { operations, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        const calendarService = new GoogleCalendarService(user.id);
        const results = await calendarService.performBatchOperationsOnPrimaryCalendar(
            operations,
            options,
        );
        return results;
    },
});
