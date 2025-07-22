import z from 'zod';
import { recurrenceRuleSchema } from './shared';

/**
 * The input schema for the update recurring event tool
 */
export const updateRecurringEventInputSchema = z.object({
    eventId: z.string().describe('ID of the recurring event to update'),
    summary: z.string().optional().describe('Updated event title'),
    start: z.string().optional().describe('Updated start time (RFC3339 format)'),
    end: z.string().optional().describe('Updated end time (RFC3339 format)'),
    location: z.string().optional().describe('Updated event location'),
    description: z.string().optional().describe('Updated event description'),
    attendees: z
        .array(z.string().email())
        .optional()
        .describe('Updated list of attendee email addresses'),
    recurrence: z
        .array(recurrenceRuleSchema)
        .optional()
        .describe('Updated recurrence rules for the event'),
    allDay: z
        .boolean()
        .optional()
        .describe(
            'Whether this is an all-day event. If true, start/end should be dates like YYYY-MM-DD',
        ),
    options: z
        .object({
            sendUpdates: z
                .enum(['all', 'externalOnly', 'none'])
                .optional()
                .describe('How to send updates to attendees'),
        })
        .optional()
        .describe('Update event options'),
});

/**
 * The output schema for the update recurring event tool
 */
export const updateRecurringEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event update'),
    eventId: z.string().optional().describe('The id of the updated event'),
    eventTitle: z.string().optional().describe('The title of the updated event'),
    eventStart: z.string().optional().describe('Updated start time (RFC3339 format)'),
    eventEnd: z.string().optional().describe('Updated end time (RFC3339 format)'),
    eventLocation: z.string().optional().describe('Updated event location'),
    eventDescription: z.string().optional().describe('Updated event description'),
    eventAttendees: z
        .array(z.string().email())
        .optional()
        .describe('Updated list of attendee email addresses'),
    eventRecurrence: z
        .array(recurrenceRuleSchema)
        .optional()
        .describe('Updated recurrence rules for the event'),
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
    eventTransparency: z.enum(['opaque', 'transparent']).optional().describe('Event transparency'),
    eventVisibility: z
        .enum(['default', 'public', 'private', 'confidential'])
        .optional()
        .describe('Event visibility'),
    eventColorId: z.string().optional().describe('Event color ID'),
    eventCreated: z.string().optional().describe('Event creation timestamp'),
    eventUpdated: z.string().optional().describe('Event last update timestamp'),
    calendarId: z.string().optional().describe('The calendar ID where the event was updated'),
});
