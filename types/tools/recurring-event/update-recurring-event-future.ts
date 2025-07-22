import z from 'zod';
import { recurrenceRuleSchema } from './shared';

/**
 * The input schema for the update future recurring events tool
 */
export const updateFutureRecurringEventsInputSchema = z.object({
    eventId: z.string().describe('ID of the recurring event series'),
    fromDateTime: z
        .string()
        .describe('Start time from which to update future instances (RFC3339 format)'),
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
 * The output schema for the update future recurring events tool
 */
export const updateFutureRecurringEventsOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the future events update'),
    eventId: z.string().optional().describe('The id of the updated recurring event series'),
    eventTitle: z.string().optional().describe('The title of the updated recurring event series'),
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
    eventOriginalStartTime: z
        .string()
        .optional()
        .describe('Original start time for recurring events'),
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
        .describe('The calendar ID where the future recurring events were updated'),
});
