import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';

/**
 * The input schema for the get event tool
 */
const getEventInputSchema = z.object({
    eventId: z.string().describe('ID of the event to retrieve'),
    options: z
        .object({
            timeZone: z
                .string()
                .optional()
                .describe('Time zone for event times (IANA timezone identifier)'),
            alwaysIncludeEmail: z
                .boolean()
                .optional()
                .describe('Whether to always include email addresses'),
            maxAttendees: z.number().optional().describe('Maximum number of attendees to include'),
        })
        .optional()
        .describe('Event retrieval options'),
});

/**
 * The output schema for the get event tool
 */
const getEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event retrieval'),
    eventId: z.string().optional().describe('The id of the retrieved event'),
    eventTitle: z.string().optional().describe('The title of the retrieved event'),
    eventStart: z.string().optional().describe('Start time (RFC3339 format)'),
    eventEnd: z.string().optional().describe('End time (RFC3339 format)'),
    eventLocation: z.string().optional().describe('Event location'),
    eventDescription: z.string().optional().describe('Event description'),
    eventAttendees: z
        .array(z.string().email())
        .optional()
        .describe('List of attendee email addresses'),
    eventStatus: z.string().optional().describe('Event status: confirmed, tentative, cancelled'),
    eventOrganizer: z
        .object({
            email: z.string().optional().describe('Organizer email'),
            displayName: z.string().optional().describe('Organizer display name'),
        })
        .optional()
        .describe('Event organizer'),
    eventCreator: z
        .object({
            email: z.string().optional().describe('Creator email'),
            displayName: z.string().optional().describe('Creator display name'),
        })
        .optional()
        .describe('Event creator'),
    eventLink: z.string().optional().describe('Link to the event'),
    eventICalUID: z.string().optional().describe('iCal UID of the event'),
    eventRecurringEventId: z.string().optional().describe('ID of the recurring event series'),
    eventTransparency: z.string().optional().describe('Event transparency: opaque, transparent'),
    eventVisibility: z
        .string()
        .optional()
        .describe('Event visibility: default, public, private, confidential'),
    eventColorId: z.string().optional().describe('Event color ID'),
    eventCreated: z.string().optional().describe('Event creation timestamp'),
    eventUpdated: z.string().optional().describe('Event last update timestamp'),
    calendarId: z
        .string()
        .optional()
        .describe('The calendar ID where the event was retrieved from'),
});

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
        const { eventId, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log('triggered get event tool', eventId, options, user);

        try {
            const calendarService = new GoogleCalendarService(user.id);

            const event = await calendarService.getEventFromPrimaryCalendar(eventId, options);

            return {
                state: 'success' as const,
                eventId: event.id,
                eventTitle: event.summary,
                eventStart: event.start.dateTime || event.start.date || '',
                eventEnd: event.end.dateTime || event.end.date || '',
                eventLocation: event.location,
                eventDescription: event.description,
                eventAttendees: event.attendees?.map((attendee) => attendee.email),
                eventStatus: event.status,
                eventOrganizer: event.organizer
                    ? {
                          email: event.organizer.email,
                          displayName: event.organizer.displayName,
                      }
                    : undefined,
                eventCreator: event.creator
                    ? {
                          email: event.creator.email,
                          displayName: event.creator.displayName,
                      }
                    : undefined,
                eventLink: event.htmlLink,
                eventICalUID: event.iCalUID,
                eventRecurringEventId: event.recurringEventId,
                eventTransparency: event.transparency,
                eventVisibility: event.visibility,
                eventColorId: event.colorId,
                eventCreated: event.created,
                eventUpdated: event.updated,
                calendarId: event.calendarId,
            };
        } catch (error) {
            console.error('Failed to get event:', error);
            return {
                state: 'failed' as const,
                eventId: eventId,
            };
        }
    },
});
