import z from 'zod';

/**
 * The input schema for the search event by iCalUID tool
 */
export const searchEventByICalUIDInputSchema = z.object({
    iCalUID: z.string().describe('iCal UID to search for events'),
    options: z
        .object({
            timeZone: z
                .string()
                .optional()
                .describe('Time zone for event times (IANA timezone identifier)'),
            includeDeleted: z
                .boolean()
                .optional()
                .describe('Whether to include deleted events in the search'),
        })
        .optional()
        .describe('Search options'),
});

/**
 * The output schema for the search event by iCalUID tool
 */
export const searchEventByICalUIDOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the search operation'),
    results: z
        .array(
            z.object({
                calendarId: z.string().describe('Calendar ID where events were found'),
                events: z
                    .array(
                        z.object({
                            id: z.string().describe('Event ID'),
                            summary: z.string().describe('Event title/summary'),
                            start: z.string().describe('Start time'),
                            end: z.string().describe('End time'),
                            location: z.string().optional().describe('Event location'),
                            description: z.string().optional().describe('Event description'),
                            attendees: z
                                .array(z.string())
                                .optional()
                                .describe('List of attendee email addresses'),
                            iCalUID: z.string().describe('iCal UID of the event'),
                            status: z.string().optional().describe('Event status'),
                        }),
                    )
                    .describe('List of events found in this calendar'),
            }),
        )
        .describe('Search results grouped by calendar'),
    totalEvents: z.number().describe('Total number of events found across all calendars'),
    totalCalendars: z.number().describe('Total number of calendars that contained matching events'),
});
