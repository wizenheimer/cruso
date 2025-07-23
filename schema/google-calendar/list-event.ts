import { z } from 'zod';
import { GoogleDefaultReminderSchema } from './list-calendar';
import { GoogleCalendarEventSchema } from './event';

// Events list query parameters schema
export const EventsListOptionsSchema = z
    .object({
        // Path parameter
        calendarId: z
            .string()
            .describe(
                'Calendar identifier. Use "primary" for the primary calendar of the currently logged in user',
            ),

        // Optional query parameters
        alwaysIncludeEmail: z.boolean().optional().describe('Deprecated and ignored'),

        eventTypes: z
            .array(
                z.enum([
                    'birthday',
                    'default',
                    'focusTime',
                    'fromGmail',
                    'outOfOffice',
                    'workingLocation',
                ]),
            )
            .optional()
            .describe(
                'Event types to return. Can be repeated to return events of different types. If unset, returns all event types',
            ),

        iCalUID: z
            .string()
            .optional()
            .describe(
                'Specifies an event ID in the iCalendar format to be provided in the response. Use this to search for an event by its iCalendar ID',
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

        orderBy: z
            .enum(['startTime', 'updated'])
            .optional()
            .describe(
                'The order of events returned. startTime only available when singleEvents is True',
            ),

        pageToken: z.string().optional().describe('Token specifying which result page to return'),

        privateExtendedProperty: z
            .array(z.string())
            .optional()
            .describe(
                'Extended properties constraint as propertyName=value. Matches only private properties. Can be repeated',
            ),

        q: z
            .string()
            .optional()
            .describe(
                'Free text search terms to find events that match in summary, description, location, attendee info, organizer info, and working location properties',
            ),

        sharedExtendedProperty: z
            .array(z.string())
            .optional()
            .describe(
                'Extended properties constraint as propertyName=value. Matches only shared properties. Can be repeated',
            ),

        showDeleted: z
            .boolean()
            .optional()
            .default(false)
            .describe('Whether to include deleted events (with status "cancelled") in the result'),

        showHiddenInvitations: z
            .boolean()
            .optional()
            .default(false)
            .describe('Whether to include hidden invitations in the result'),

        singleEvents: z
            .boolean()
            .optional()
            .default(false)
            .describe(
                'Whether to expand recurring events into instances and only return single events and instances',
            ),

        syncToken: z
            .string()
            .optional()
            .describe(
                'Token from nextSyncToken field for incremental synchronization. Makes result contain only entries changed since then',
            ),

        timeMax: z
            .string()
            .datetime()
            .optional()
            .describe(
                "Upper bound (exclusive) for an event's start time. Must be RFC3339 timestamp with mandatory time zone offset",
            ),

        timeMin: z
            .string()
            .datetime()
            .optional()
            .describe(
                "Lower bound (exclusive) for an event's end time. Must be RFC3339 timestamp with mandatory time zone offset",
            ),

        timeZone: z
            .string()
            .optional()
            .describe('Time zone used in the response. Default is the time zone of the calendar'),

        updatedMin: z
            .string()
            .datetime()
            .optional()
            .describe(
                "Lower bound for an event's last modification time (RFC3339 timestamp). When specified, deleted entries since this time are always included",
            ),
    })
    .refine(
        (data) => {
            // Validation: orderBy 'startTime' only available when singleEvents is True
            if (data.orderBy === 'startTime' && !data.singleEvents) {
                return false;
            }
            return true;
        },
        {
            message: "orderBy 'startTime' is only available when singleEvents is True",
            path: ['orderBy'],
        },
    )
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
    )
    .refine(
        (data) => {
            // Validation: syncToken cannot be used with certain parameters
            if (data.syncToken) {
                const incompatibleParams = [
                    'iCalUID',
                    'orderBy',
                    'privateExtendedProperty',
                    'q',
                    'sharedExtendedProperty',
                    'timeMin',
                    'timeMax',
                    'updatedMin',
                ];

                for (const param of incompatibleParams) {
                    if (data[param as keyof typeof data] !== undefined) {
                        return false;
                    }
                }
            }
            return true;
        },
        {
            message:
                'syncToken cannot be specified together with iCalUID, orderBy, privateExtendedProperty, q, sharedExtendedProperty, timeMin, timeMax, or updatedMin',
            path: ['syncToken'],
        },
    );

export const EventsListResponseSchema = z
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

        items: z.array(GoogleCalendarEventSchema).describe('List of events on the calendar'),
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
