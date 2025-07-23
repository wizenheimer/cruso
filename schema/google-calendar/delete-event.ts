import { z } from 'zod';

// Delete event query parameters schema
export const DeleteEventOptionsSchema = z.object({
    // Path parameters
    calendarId: z
        .string()
        .describe(
            'Calendar identifier. Use "primary" for the primary calendar of the currently logged in user',
        ),

    eventId: z.string().describe('Event identifier'),

    // Optional query parameters
    sendNotifications: z
        .boolean()
        .optional()
        .describe(
            'Deprecated. Please use sendUpdates instead. Whether to send notifications about the deletion',
        ),

    sendUpdates: z
        .enum(['all', 'externalOnly', 'none'])
        .optional()
        .describe(
            'Guests who should receive notifications about the deletion. all: all guests, externalOnly: non-Google Calendar guests only, none: no notifications',
        ),
});

// Delete event response schema (empty response body)
export const DeleteEventResponseSchema = z
    .void()
    .describe('Empty response body for successful deletion');
