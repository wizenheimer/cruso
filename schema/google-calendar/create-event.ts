import { z } from 'zod';
import {
    ConferenceDataSchema,
    EventDateTimeSchema,
    FocusTimePropertiesSchema,
    GoogleCalendarEventSchema,
    OutOfOfficePropertiesSchema,
    WorkingLocationPropertiesSchema,
} from './event';

// Create event query parameters schema
export const CreateEventOptionsSchema = z.object({
    // Path parameters
    calendarId: z
        .string()
        .describe(
            'Calendar identifier. Use "primary" for the primary calendar of the currently logged in user',
        ),

    // Optional query parameters
    conferenceDataVersion: z
        .number()
        .int()
        .min(0)
        .max(1)
        .optional()
        .default(0)
        .describe(
            'Version number of conference data supported by the API client. Version 0 assumes no conference data support, Version 1 enables ConferenceData support. Default is 0',
        ),

    maxAttendees: z
        .number()
        .int()
        .min(1)
        .optional()
        .describe(
            'The maximum number of attendees to include in the response. If there are more, only the participant is returned',
        ),

    sendNotifications: z
        .boolean()
        .optional()
        .describe(
            'Deprecated. Please use sendUpdates instead. Whether to send notifications about the creation of the new event',
        ),

    sendUpdates: z
        .enum(['all', 'externalOnly', 'none'])
        .optional()
        .default('none')
        .describe(
            'Whether to send notifications about the creation of the new event. all: all guests, externalOnly: non-Google Calendar guests only, none: no notifications',
        ),

    supportsAttachments: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether API client performing operation supports event attachments'),
});

// Create event request body schema (subset of CalendarEventSchema with required fields)
export const CreateEventRequestSchema = z
    .object({
        // Required properties
        start: EventDateTimeSchema.describe(
            'The (inclusive) start time of the event. For a recurring event, this is the start time of the first instance',
        ),

        end: EventDateTimeSchema.describe(
            'The (exclusive) end time of the event. For a recurring event, this is the end time of the first instance',
        ),

        // Optional properties (subset of full event schema, excluding read-only fields)
        id: z
            .string()
            .min(5)
            .max(1024)
            .regex(/^[a-v0-9]+$/)
            .optional()
            .describe(
                'Opaque identifier of the event. Must follow base32hex encoding rules, length 5-1024 characters. If not specified, will be auto-generated',
            ),

        summary: z.string().optional().describe('Title of the event'),

        description: z.string().optional().describe('Description of the event. Can contain HTML'),

        location: z
            .string()
            .optional()
            .describe('Geographic location of the event as free-form text'),

        colorId: z
            .string()
            .optional()
            .describe(
                'The color of the event. This is an ID referring to an entry in the event section of the colors definition',
            ),

        status: z
            .enum(['confirmed', 'tentative', 'cancelled'])
            .optional()
            .default('confirmed')
            .describe('Status of the event'),

        transparency: z
            .enum(['opaque', 'transparent'])
            .optional()
            .default('opaque')
            .describe(
                'Whether the event blocks time on the calendar. opaque = busy, transparent = available',
            ),

        visibility: z
            .enum(['default', 'public', 'private', 'confidential'])
            .optional()
            .default('default')
            .describe('Visibility of the event'),

        eventType: z
            .enum(['birthday', 'default', 'focusTime', 'outOfOffice', 'workingLocation'])
            .optional()
            .default('default')
            .describe(
                'Specific type of the event. Cannot be modified after creation. Note: fromGmail cannot be created via API',
            ),

        recurrence: z
            .array(z.string())
            .optional()
            .describe(
                'List of RRULE, EXRULE, RDATE and EXDATE lines for a recurring event, as specified in RFC5545',
            ),

        originalStartTime: EventDateTimeSchema.optional().describe(
            'For an instance of a recurring event, this is the time at which this event would start according to the recurrence data. Immutable',
        ),

        sequence: z.number().int().optional().describe('Sequence number as per iCalendar'),

        attendees: z
            .array(
                z.object({
                    email: z
                        .string()
                        .email()
                        .describe("The attendee's email address. Required when adding an attendee"),

                    displayName: z
                        .string()
                        .optional()
                        .describe("The attendee's name, if available"),

                    optional: z
                        .boolean()
                        .optional()
                        .default(false)
                        .describe('Whether this is an optional attendee'),

                    resource: z
                        .boolean()
                        .optional()
                        .default(false)
                        .describe(
                            'Whether the attendee is a resource. Can only be set when first added',
                        ),

                    responseStatus: z
                        .enum(['needsAction', 'declined', 'tentative', 'accepted'])
                        .optional()
                        .default('needsAction')
                        .describe(
                            "The attendee's response status. needsAction recommended for new events",
                        ),

                    comment: z.string().optional().describe("The attendee's response comment"),

                    additionalGuests: z
                        .number()
                        .int()
                        .min(0)
                        .optional()
                        .default(0)
                        .describe('Number of additional guests'),
                }),
            )
            .optional()
            .describe('The attendees of the event'),

        extendedProperties: z
            .object({
                private: z
                    .record(z.string())
                    .optional()
                    .describe(
                        'Properties that are private to the copy of the event that appears on this calendar',
                    ),

                shared: z
                    .record(z.string())
                    .optional()
                    .describe(
                        "Properties that are shared between copies of the event on other attendees' calendars",
                    ),
            })
            .optional()
            .describe('Extended properties of the event'),

        conferenceData: ConferenceDataSchema.optional().describe(
            'The conference-related information. To create new conference details use the createRequest field. Remember to set conferenceDataVersion to 1',
        ),

        anyoneCanAddSelf: z
            .boolean()
            .optional()
            .default(false)
            .describe('Whether anyone can invite themselves to the event'),

        guestsCanInviteOthers: z
            .boolean()
            .optional()
            .default(true)
            .describe('Whether attendees other than the organizer can invite others to the event'),

        guestsCanModify: z
            .boolean()
            .optional()
            .default(false)
            .describe('Whether attendees other than the organizer can modify the event'),

        guestsCanSeeOtherGuests: z
            .boolean()
            .optional()
            .default(true)
            .describe(
                "Whether attendees other than the organizer can see who the event's attendees are",
            ),

        reminders: z
            .object({
                useDefault: z
                    .boolean()
                    .describe('Whether the default reminders of the calendar apply to the event'),

                overrides: z
                    .array(
                        z.object({
                            method: z
                                .enum(['email', 'popup'])
                                .describe('The method used by this reminder'),

                            minutes: z
                                .number()
                                .int()
                                .min(0)
                                .max(40320)
                                .describe(
                                    'Number of minutes before the start when the reminder should trigger',
                                ),
                        }),
                    )
                    .max(5)
                    .optional()
                    .describe('Event-specific reminders. Maximum 5 override reminders'),
            })
            .optional()
            .describe("Information about the event's reminders"),

        source: z
            .object({
                url: z
                    .string()
                    .url()
                    .describe('URL of the source pointing to a resource. Must be HTTP or HTTPS'),

                title: z
                    .string()
                    .optional()
                    .describe(
                        'Title of the source; for example a title of a web page or an email subject',
                    ),
            })
            .optional()
            .describe('Source from which the event was created'),

        attachments: z
            .array(
                z.object({
                    fileUrl: z
                        .string()
                        .url()
                        .describe(
                            'URL link to the attachment. Required when adding an attachment. For Google Drive files, use alternateLink format',
                        ),

                    title: z.string().optional().describe('Attachment title'),

                    mimeType: z
                        .string()
                        .optional()
                        .describe('Internet media type (MIME type) of the attachment'),

                    iconLink: z
                        .string()
                        .url()
                        .optional()
                        .describe("URL link to the attachment's icon"),
                }),
            )
            .max(25)
            .optional()
            .describe('File attachments for the event. Maximum 25 attachments per event'),

        workingLocationProperties: WorkingLocationPropertiesSchema.optional().describe(
            'Working location event data',
        ),

        outOfOfficeProperties: OutOfOfficePropertiesSchema.optional().describe(
            'Out of office event data. Used if eventType is outOfOffice',
        ),

        focusTimeProperties: FocusTimePropertiesSchema.optional().describe(
            'Focus Time event data. Used if eventType is focusTime',
        ),

        birthdayProperties: z
            .object({
                type: z
                    .enum(['birthday'])
                    .optional()
                    .default('birthday')
                    .describe(
                        'Type of birthday event. The Calendar API only supports creating events with type "birthday"',
                    ),
            })
            .optional()
            .describe('Birthday or special event data. Used if eventType is "birthday". Immutable'),
    })
    .refine(
        (data) => {
            // Validation: start time must be before end time
            if (data.start.dateTime && data.end.dateTime) {
                return new Date(data.start.dateTime) < new Date(data.end.dateTime);
            }
            if (data.start.date && data.end.date) {
                return new Date(data.start.date) <= new Date(data.end.date);
            }
            return true;
        },
        {
            message: 'Start time must be before end time',
            path: ['start', 'end'],
        },
    )
    .refine(
        (data) => {
            // Validation: eventType consistency with type-specific properties
            if (data.eventType === 'birthday' && !data.birthdayProperties) {
                return false;
            }
            if (data.eventType === 'focusTime' && !data.focusTimeProperties) {
                return false;
            }
            if (data.eventType === 'outOfOffice' && !data.outOfOfficeProperties) {
                return false;
            }
            if (data.eventType === 'workingLocation' && !data.workingLocationProperties) {
                return false;
            }
            return true;
        },
        {
            message: 'Event type must match corresponding properties',
            path: ['eventType'],
        },
    );

// Create event response schema (returns the created event)
export const CreateEventResponseSchema = GoogleCalendarEventSchema.describe(
    'Created calendar event resource with server-generated fields',
);

// Combined create event schema (options + request body)
export const CreateEventSchema = z.object({
    options: CreateEventOptionsSchema.describe('Query parameters for the create event request'),

    event: CreateEventRequestSchema.describe('Event data to be created'),
});
