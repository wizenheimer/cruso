import { User } from '@/types/api/users';
import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';

const deleteEventInputSchema = z.object({
    eventId: z.string().describe('ID of the event to delete'),
    notifyAttendees: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to notify attendees of the deletion'),
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

const deleteEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event deletion'),
    eventId: z.string().optional().describe('The id of the event deleted'),
    eventTitle: z.string().optional().describe('The title of the event deleted'),
    calendarId: z.string().optional().describe('The calendar ID where the event was deleted'),
});

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
