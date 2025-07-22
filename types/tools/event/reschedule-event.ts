import z from 'zod';

/**
 * The input schema for the reschedule event tool
 */
export const rescheduleEventInputSchema = z.object({
    eventId: z.string().describe('ID of the event to reschedule'),
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
 * The output schema for the reschedule event tool
 */
export const rescheduleEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event rescheduling'),
    eventId: z.string().optional().describe('The id of the rescheduled event'),
    eventTitle: z.string().optional().describe('The title of the rescheduled event'),
    eventStart: z.string().optional().describe('New start time (RFC3339 format)'),
    eventEnd: z.string().optional().describe('New end time (RFC3339 format)'),
    eventLocation: z.string().optional().describe('Event location'),
    eventDescription: z.string().optional().describe('Event description'),
    eventAttendees: z
        .array(z.string().email())
        .optional()
        .describe('List of attendee email addresses'),
    calendarId: z.string().optional().describe('The calendar ID where the event was rescheduled'),
});
