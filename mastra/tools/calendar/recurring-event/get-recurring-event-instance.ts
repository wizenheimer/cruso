import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import {
    getRecurringEventInstancesInputSchema,
    getRecurringEventInstancesOutputSchema,
} from '@/types/tools/recurring-event';

/**
 * Get recurring event instances from google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The recurring event instances details
 */
export const getRecurringEventInstancesTool = createTool({
    id: 'get-recurring-event-instances',
    description: 'Get recurring event instances from google calendar for the current user',
    inputSchema: getRecurringEventInstancesInputSchema,
    outputSchema: getRecurringEventInstancesOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { eventId, timeMin, timeMax, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log(
            'triggered get recurring event instances tool',
            eventId,
            timeMin,
            timeMax,
            options,
            user,
        );

        try {
            const calendarService = new GoogleCalendarService(user.id);
            const result = await calendarService.listRecurringEventInstancesInPrimaryCalendar(
                eventId,
                timeMin,
                timeMax,
                options,
            );

            // Transform CalendarEvent instances to simplified format
            const instances = result.instances.map((instance) => ({
                id: instance.id || '',
                summary: instance.summary,
                start: instance.start.dateTime || instance.start.date || '',
                end: instance.end.dateTime || instance.end.date || '',
                location: instance.location,
                description: instance.description,
                attendees: instance.attendees?.map((attendee) => attendee.email),
                status: instance.status,
                recurringEventId: instance.recurringEventId,
                originalStartTime:
                    instance.originalStartTime?.dateTime || instance.originalStartTime?.date,
                iCalUID: instance.iCalUID,
            }));

            return {
                state: 'success' as const,
                instances: instances,
                nextPageToken: result.nextPageToken,
                calendarId: result.calendarId,
                totalInstances: instances.length,
            };
        } catch (error) {
            console.error('Failed to get recurring event instances:', error);
            return {
                state: 'failed' as const,
                instances: [],
                totalInstances: 0,
            };
        }
    },
});
