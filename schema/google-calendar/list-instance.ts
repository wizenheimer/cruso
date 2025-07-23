import { z } from 'zod';
import { GoogleCalendarEventSchema } from './event';
import { GoogleDefaultReminderSchema } from './list-calendar';

// Get event instances query parameters schema
export const GetEventInstancesOptionsSchema = z
    .object({
        // Path parameters
        calendarId: z
            .string()
            .describe(
                'Calendar identifier. Use "primary" for the primary calendar of the currently logged in user',
            ),

        eventId: z.string().describe('Recurring event identifier'),

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

        maxResults: z
            .number()
            .int()
            .min(1)
            .max(2500)
            .optional()
            .default(250)
            .describe(
                'Maximum number of events returned on one result page. Default is 250, maximum is 2500',
            ),

        originalStart: z
            .string()
            .optional()
            .describe('The original start time of the instance in the result. Optional'),

        pageToken: z.string().optional().describe('Token specifying which result page to return'),

        showDeleted: z
            .boolean()
            .optional()
            .default(false)
            .describe(
                'Whether to include deleted events (with status "cancelled") in the result. Cancelled instances of recurring events will still be included if singleEvents is False',
            ),

        timeMax: z
            .string()
            .datetime()
            .optional()
            .describe(
                "Upper bound (exclusive) for an event's start time to filter by. Must be RFC3339 timestamp with mandatory time zone offset",
            ),

        timeMin: z
            .string()
            .datetime()
            .optional()
            .describe(
                "Lower bound (inclusive) for an event's end time to filter by. Must be RFC3339 timestamp with mandatory time zone offset",
            ),

        timeZone: z
            .string()
            .optional()
            .describe('Time zone used in the response. Default is the time zone of the calendar'),
    })
    .refine(
        (data) => {
            // Validation: timeMin must be smaller than timeMax if both are set
            if (data.timeMin && data.timeMax) {
                return new Date(data.timeMin) < new Date(data.timeMax);
            }
            return true;
        },
        {
            message: 'timeMin must be smaller than timeMax',
            path: ['timeMin', 'timeMax'],
        },
    );

// Get event instances response schema (same structure as events list response)
export const GetEventInstancesResponseSchema = z
    .object({
        kind: z.literal('calendar#events').describe('Type of the collection'),

        etag: z.string().describe('ETag of the collection'),

        summary: z.string().describe('Title of the calendar. Read-only'),

        description: z.string().optional().describe('Description of the calendar. Read-only'),

        updated: z
            .string()
            .datetime()
            .describe('Last modification time of the calendar (as a RFC3339 timestamp). Read-only'),

        timeZone: z.string().describe('The time zone of the calendar. Read-only'),

        accessRole: z
            .enum(['none', 'freeBusyReader', 'reader', 'writer', 'owner'])
            .describe("The user's access role for this calendar. Read-only"),

        defaultReminders: z
            .array(GoogleDefaultReminderSchema)
            .describe(
                'The default reminders on the calendar for the authenticated user. Apply to all events that do not explicitly override them',
            ),

        nextPageToken: z
            .string()
            .optional()
            .describe(
                'Token used to access the next page of this result. Omitted if no further results are available, in which case nextSyncToken is provided',
            ),

        nextSyncToken: z
            .string()
            .optional()
            .describe(
                'Token used at a later point in time to retrieve only the entries that have changed since this result was returned. Omitted if further results are available',
            ),

        items: z
            .array(GoogleCalendarEventSchema)
            .describe('List of event instances from the recurring event'),
    })
    .refine(
        (data) => {
            // Validation: either nextPageToken OR nextSyncToken should be present, not both
            const hasNextPage = !!data.nextPageToken;
            const hasNextSync = !!data.nextSyncToken;

            // It's valid to have neither (empty result), but not both
            return !(hasNextPage && hasNextSync);
        },
        {
            message: 'Either nextPageToken or nextSyncToken should be present, not both',
            path: ['nextPageToken', 'nextSyncToken'],
        },
    );
