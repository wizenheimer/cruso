import z from 'zod';
import { recurrenceRuleSchema } from './shared';

/**
 * The input schema for the get recurring event tool
 */
export const getRecurringEventInputSchema = z.object({
    eventId: z.string().describe('ID of the recurring event to retrieve'),
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
 * The output schema for the get recurring event tool
 */
export const getRecurringEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event retrieval'),
    eventId: z.string().optional().describe('The id of the retrieved recurring event'),
    eventTitle: z.string().optional().describe('The title of the retrieved recurring event'),
    eventStart: z.string().optional().describe('Start time (RFC3339 format)'),
    eventEnd: z.string().optional().describe('End time (RFC3339 format)'),
    eventLocation: z.string().optional().describe('Event location'),
    eventDescription: z.string().optional().describe('Event description'),
    eventAttendees: z
        .array(z.string().email())
        .optional()
        .describe('List of attendee email addresses'),
    eventRecurrence: z
        .array(recurrenceRuleSchema)
        .optional()
        .describe('Recurrence rules for the event'),
    eventStatus: z
        .enum(['confirmed', 'tentative', 'cancelled'])
        .optional()
        .describe('Event status'),
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
    eventOriginalStartTime: z
        .string()
        .optional()
        .describe('Original start time for recurring events'),
    eventTransparency: z.enum(['opaque', 'transparent']).optional().describe('Event transparency'),
    eventVisibility: z
        .enum(['default', 'public', 'private', 'confidential'])
        .optional()
        .describe('Event visibility'),
    eventColorId: z.string().optional().describe('Event color ID'),
    eventCreated: z.string().optional().describe('Event creation timestamp'),
    eventUpdated: z.string().optional().describe('Event last update timestamp'),
    calendarId: z
        .string()
        .optional()
        .describe('The calendar ID where the recurring event was retrieved from'),
});
