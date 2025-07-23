import { z } from 'zod';

// Default reminder schema
const GoogleDefaultReminderSchema = z.object({
    method: z
        .enum(['email', 'popup'])
        .describe(
            'The method used by this reminder. "email" for email reminders, "popup" for UI popup reminders',
        ),
    minutes: z
        .number()
        .int()
        .min(0)
        .max(40320)
        .describe(
            'Number of minutes before the start of the event when the reminder should trigger. Valid values are between 0 and 40320 (4 weeks in minutes)',
        ),
});

// Notification schema
const GoogleNotificationSchema = z.object({
    type: z
        .enum(['eventCreation', 'eventChange', 'eventCancellation', 'eventResponse', 'agenda'])
        .describe(
            'The type of notification: eventCreation, eventChange, eventCancellation, eventResponse, or agenda',
        ),
    method: z
        .enum(['email'])
        .describe(
            'The method used to deliver the notification. Currently only "email" is supported',
        ),
});

// Notification settings schema
const GoogleNotificationSettingsSchema = z.object({
    notifications: z
        .array(GoogleNotificationSchema)
        .describe('The list of notifications set for this calendar'),
});

// Conference properties schema
const GoogleConferencePropertiesSchema = z.object({
    allowedConferenceSolutionTypes: z
        .array(z.enum(['eventHangout', 'eventNamedHangout', 'hangoutsMeet']))
        .optional()
        .describe('The types of conference solutions that are supported for this calendar'),
});

// Main CalendarList entry schema
export const GoogleCalendarListEntrySchema = z.object({
    kind: z.literal('calendar#calendarListEntry').describe('Type of the resource'),

    etag: z.string().describe('ETag of the resource'),

    id: z.string().describe('Identifier of the calendar'),

    summary: z.string().describe('Title of the calendar. Read-only'),

    description: z.string().optional().describe('Description of the calendar. Optional. Read-only'),

    location: z
        .string()
        .optional()
        .describe('Geographic location of the calendar as free-form text. Optional. Read-only'),

    timeZone: z.string().optional().describe('The time zone of the calendar. Optional. Read-only'),

    summaryOverride: z
        .string()
        .optional()
        .describe(
            'The summary that the authenticated user has set for this calendar. Optional. Writable',
        ),

    colorId: z
        .string()
        .optional()
        .describe(
            'The color of the calendar. This is an ID referring to an entry in the calendar section of the colors definition. This property is superseded by backgroundColor and foregroundColor properties. Optional. Writable',
        ),

    backgroundColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional()
        .describe(
            'The main color of the calendar in the hexadecimal format "#0088aa". This property supersedes the index-based colorId property. Optional. Writable',
        ),

    foregroundColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional()
        .describe(
            'The foreground color of the calendar in the hexadecimal format "#ffffff". This property supersedes the index-based colorId property. Optional. Writable',
        ),

    hidden: z
        .boolean()
        .optional()
        .describe(
            'Whether the calendar has been hidden from the list. Optional. The attribute is only returned when the calendar is hidden, in which case the value is true. Writable',
        ),

    selected: z
        .boolean()
        .optional()
        .default(false)
        .describe(
            'Whether the calendar content shows up in the calendar UI. Optional. The default is False. Writable',
        ),

    accessRole: z
        .enum(['freeBusyReader', 'reader', 'writer', 'owner'])
        .describe(
            'The effective access role that the authenticated user has on the calendar. Read-only. freeBusyReader: read access to free/busy info, reader: read access with hidden private event details, writer: read and write access with visible private events, owner: full permissions including ACL manipulation',
        ),

    defaultReminders: z
        .array(GoogleDefaultReminderSchema)
        .optional()
        .describe(
            'The default reminders that the authenticated user has for this calendar. Writable',
        ),

    notificationSettings: GoogleNotificationSettingsSchema.optional().describe(
        'The notifications that the authenticated user is receiving for this calendar. Writable',
    ),

    primary: z
        .boolean()
        .optional()
        .default(false)
        .describe(
            'Whether the calendar is the primary calendar of the authenticated user. Read-only. Optional. The default is False',
        ),

    deleted: z
        .boolean()
        .optional()
        .default(false)
        .describe(
            'Whether this calendar list entry has been deleted from the calendar list. Read-only. Optional. The default is False',
        ),

    conferenceProperties: GoogleConferencePropertiesSchema.optional().describe(
        'Conferencing properties for this calendar, for example what types of conferences are allowed',
    ),
});

export const GoogleCalendarListOptionsSchema = z
    .object({
        maxResults: z
            .number()
            .int()
            .min(1)
            .max(250)
            .optional()
            .describe(
                'Maximum number of entries returned on one result page. By default the value is 100 entries. The page size can never be larger than 250 entries. Optional',
            ),

        minAccessRole: z
            .enum(['freeBusyReader', 'reader', 'writer', 'owner'])
            .optional()
            .describe(
                'The minimum access role for the user in the returned entries. Optional. The default is no restriction. freeBusyReader: read free/busy info, reader: read non-private events, writer: read and modify events, owner: read and modify events and access control lists',
            ),

        pageToken: z
            .string()
            .optional()
            .describe('Token specifying which result page to return. Optional'),

        showDeleted: z
            .boolean()
            .optional()
            .default(false)
            .describe(
                'Whether to include deleted calendar list entries in the result. Optional. The default is False',
            ),

        showHidden: z
            .boolean()
            .optional()
            .default(false)
            .describe('Whether to show hidden entries. Optional. The default is False'),

        syncToken: z
            .string()
            .optional()
            .describe(
                'Token obtained from the nextSyncToken field returned on the last page of results from the previous list request. It makes the result contain only entries that have changed since then. Cannot be specified together with minAccessRole. Optional',
            ),
    })
    .refine(
        (data) => {
            // Validation rule: syncToken cannot be used with minAccessRole
            if (data.syncToken && data.minAccessRole) {
                return false;
            }
            return true;
        },
        {
            message: 'syncToken cannot be specified together with minAccessRole query parameter',
            path: ['syncToken'],
        },
    );

export const GoogleCalendarListResponseSchema = z
    .object({
        kind: z.literal('calendar#calendarList').describe('Type of the collection'),

        etag: z.string().describe('ETag of the collection'),

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
                'Token used at a later point in time to retrieve only the entries that have changed since this result was returned. Omitted if further results are available, in which case nextPageToken is provided',
            ),

        items: z
            .array(GoogleCalendarListEntrySchema)
            .describe("Calendars that are present on the user's calendar list"),
    })
    .refine(
        (data) => {
            // Validation rule: either nextPageToken OR nextSyncToken should be present, not both
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
