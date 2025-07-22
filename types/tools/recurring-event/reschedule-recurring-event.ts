import z from 'zod';
import { recurrenceRuleSchema } from './shared';

/**
 * The input schema for the reschedule recurring event tool
 */
export const rescheduleRecurringEventInputSchema = z.object({
    eventId: z.string().describe('ID of the recurring event to reschedule'),
    startDateTime: z
        .string()
        .describe('New start time (RFC3339 format, e.g., 2023-10-27T10:00:00Z)'),
    endDateTime: z.string().describe('New end time (RFC3339 format, e.g., 2023-10-27T11:00:00Z)'),
    timeZone: z
        .string()
        .describe('Time zone for the event (IANA timezone identifier, e.g., America/New_York)'),
    options: z
        .object({
            sendUpdates: z
                .enum(['all', 'externalOnly', 'none'])
                .optional()
                .describe('How to send updates to attendees'),
        })
        .optional()
        .describe('Reschedule event options'),
});

/**
 * The output schema for the reschedule recurring event tool
 */
export const rescheduleRecurringEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event rescheduling'),
    eventId: z.string().optional().describe('The id of the rescheduled recurring event'),
    eventTitle: z.string().optional().describe('The title of the rescheduled recurring event'),
    eventStart: z.string().optional().describe('New start time (RFC3339 format)'),
    eventEnd: z.string().optional().describe('New end time (RFC3339 format)'),
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
        .describe('The calendar ID where the recurring event was rescheduled'),
});
