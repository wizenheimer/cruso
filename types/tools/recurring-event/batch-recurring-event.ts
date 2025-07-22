import z from 'zod';
import { recurrenceRuleSchema } from './shared';

export const batchRecurringEventInputSchema = z.object({
    events: z
        .array(
            z.object({
                title: z.string().describe('Event title'),
                start: z
                    .string()
                    .describe('Start time (RFC3339 format, e.g., 2023-10-27T10:00:00Z)'),
                end: z.string().describe('End time (RFC3339 format, e.g., 2023-10-27T11:00:00Z)'),
                location: z.string().optional().describe('Event location'),
                description: z.string().optional().describe('Event description'),
                attendees: z
                    .array(z.string().email())
                    .optional()
                    .describe('List of attendee email addresses'),
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
                recurrence: z
                    .array(recurrenceRuleSchema)
                    .describe('Recurrence rules for the event'),
            }),
        )
        .describe('Array of recurring events to create'),
    options: z
        .object({
            sendUpdates: z
                .enum(['all', 'externalOnly', 'none'])
                .optional()
                .describe('How to send updates to attendees'),
            conferenceDataVersion: z.number().optional().describe('Conference data version'),
        })
        .optional()
        .describe('Batch creation options'),
});

export const batchRecurringEventOutputSchema = z.object({
    successful: z
        .array(
            z.object({
                event: z
                    .object({
                        title: z.string().describe('Event title'),
                        start: z.string().describe('Start time'),
                        end: z.string().describe('End time'),
                        location: z.string().optional().describe('Event location'),
                        description: z.string().optional().describe('Event description'),
                        attendees: z
                            .array(z.string().email())
                            .optional()
                            .describe('List of attendee email addresses'),
                        recurrence: z
                            .array(recurrenceRuleSchema)
                            .describe('Recurrence rules for the event'),
                    })
                    .describe('The event that was created'),
                result: z
                    .object({
                        eventId: z.string().describe('Created event ID'),
                        eventTitle: z.string().describe('Created event title'),
                        eventStart: z.string().describe('Created event start time'),
                        eventEnd: z.string().describe('Created event end time'),
                        eventLocation: z.string().optional().describe('Created event location'),
                        eventDescription: z
                            .string()
                            .optional()
                            .describe('Created event description'),
                        eventAttendees: z
                            .array(z.string().email())
                            .optional()
                            .describe('Created event attendees'),
                        eventRecurrence: z
                            .array(recurrenceRuleSchema)
                            .optional()
                            .describe('Created event recurrence rules'),
                        calendarId: z.string().describe('Calendar ID where event was created'),
                    })
                    .describe('Result of the successful creation'),
            }),
        )
        .describe('Successfully created events'),
    failed: z
        .array(
            z.object({
                event: z
                    .object({
                        title: z.string().describe('Event title'),
                        start: z.string().describe('Start time'),
                        end: z.string().describe('End time'),
                        location: z.string().optional().describe('Event location'),
                        description: z.string().optional().describe('Event description'),
                        attendees: z
                            .array(z.string().email())
                            .optional()
                            .describe('List of attendee email addresses'),
                        recurrence: z
                            .array(recurrenceRuleSchema)
                            .describe('Recurrence rules for the event'),
                    })
                    .describe('The event that failed to create'),
                error: z.string().describe('Error message'),
            }),
        )
        .describe('Failed event creations'),
});
