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
        const { eventId, notifyAttendees, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log('triggered delete event tool', eventId, notifyAttendees, user);

        try {
            const calendarService = new GoogleCalendarService(user.id);

            // Convert notifyAttendees to sendUpdates option for backward compatibility
            const deleteOptions = {
                ...options,
                sendUpdates: options?.sendUpdates || (notifyAttendees ? 'all' : 'none'),
            };

            const result = await calendarService.deleteEventFromPrimaryCalendar(
                eventId,
                deleteOptions,
            );

            return {
                state: 'success' as const,
                eventId: eventId,
                eventTitle: 'Event Title', // Note: We don't have the title after deletion
                calendarId: result.calendarId,
            };
        } catch (error) {
            console.error('Failed to delete event:', error);
            return {
                state: 'failed' as const,
                eventId: eventId,
                eventTitle: 'Event Title',
            };
        }
    },
});
