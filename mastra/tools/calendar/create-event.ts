import { createTool } from '@mastra/core/tools';
import z from 'zod';

/**
 * The input schema for the create event tool
 */
const createEventInputSchema = z.object({
    title: z.string().describe('Event title'),
    start: z.string().describe('Start time (RFC3339 format, e.g., 2023-10-27T10:00:00Z)'),
    end: z.string().describe('End time (RFC3339 format, e.g., 2023-10-27T11:00:00Z)'),
    location: z.string().optional().describe('Event location'),
    description: z.string().optional().describe('Event description'),
    attendees: z.array(z.string().email()).optional().describe('List of attendee email addresses'),
    conferenceData: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to add Google Meet videoconference'),
    allDay: z
        .boolean()
        .optional()
        .default(false)
        .describe(
            'Whether this is an all-day event. If true, start/end should be dates like YYYY-MM-DD',
        ),
});

/**
 * The output schema for the create event tool
 */
const createEventOutputSchema = z.object({
    state: z
        .enum(['soft-conflict', 'hard-conflict', 'success', 'failed'])
        .describe('The state of the event creation'),
    eventId: z.string().optional().describe('The id of the event created'),
    eventLink: z.string().optional().describe('The link to the event'),
    eventTitle: z.string().describe('Event title'),
    eventStart: z.string().describe('Start time (RFC3339 format, e.g., 2023-10-27T10:00:00Z)'),
    eventEnd: z.string().describe('End time (RFC3339 format, e.g., 2023-10-27T11:00:00Z)'),
    eventLocation: z.string().optional().describe('Event location'),
    eventDescription: z.string().optional().describe('Event description'),
    eventAttendees: z
        .array(z.string().email())
        .optional()
        .describe('List of attendee email addresses'),
    eventConferenceData: z
        .boolean()
        .optional()
        .describe('Whether to add Google Meet videoconference'),
    eventAllDay: z
        .boolean()
        .optional()
        .describe(
            'Whether this is an all-day event. If true, start/end should be dates like YYYY-MM-DD',
        ),
});

/**
 * List upcoming events from google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The list of events
 */
export const createEventTool = createTool({
    id: 'create-event',
    description: 'Create a new event in google calendar for the current user',
    inputSchema: createEventInputSchema,
    outputSchema: createEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { title, start, end, location, description, attendees, conferenceData, allDay } =
            context;
        const userId = runtimeContext.get('userId');
        if (!userId) {
            throw new Error('User ID is required');
        }
        console.log(
            'triggered create event tool',
            title,
            start,
            end,
            location,
            description,
            attendees,
            conferenceData,
            allDay,
            userId,
        );
        return {
            state: 'success' as const,
            eventId: 'event_id',
            eventLink: 'https://calendar.google.com/event?event=event_id',
            eventTitle: title,
            eventStart: start,
            eventEnd: end,
            eventLocation: location,
            eventDescription: description,
            eventAttendees: attendees,
            eventConferenceData: conferenceData,
            eventAllDay: allDay,
        };
    },
});
