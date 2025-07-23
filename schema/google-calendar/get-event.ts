import { z } from 'zod';
import { GoogleCalendarEventSchema } from './event';

export const GetEventOptionsSchema = z.object({
    // Path parameters
    calendarId: z
        .string()
        .describe(
            'Calendar identifier. Use "primary" for the primary calendar of the currently logged in user',
        ),

    eventId: z.string().describe('Event identifier'),

    // Optional query parameters
    alwaysIncludeEmail: z
        .boolean()
        .optional()
        .describe(
            'Deprecated and ignored. A value will always be returned in the email field for organizer, creator and attendees',
        ),

    maxAttendees: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
            'The maximum number of attendees to include in the response. If there are more, only the participant is returned',
        ),

    timeZone: z
        .string()
        .optional()
        .describe('Time zone used in the response. Default is the time zone of the calendar'),
});

export const GetEventResponseSchema = GoogleCalendarEventSchema.describe(
    'Single calendar event resource',
);
