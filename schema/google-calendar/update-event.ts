import { z } from 'zod';
import {
    ConferenceDataSchema,
    EventDateTimeSchema,
    FocusTimePropertiesSchema,
    GoogleCalendarEventSchema,
    OutOfOfficePropertiesSchema,
    WorkingLocationPropertiesSchema,
} from './event';

// Update event query parameters schema
export const UpdateEventOptionsSchema = z.object({
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
            'Deprecated. Please use sendUpdates instead. Whether to send notifications about the event update',
        ),

    sendUpdates: z
        .enum(['all', 'externalOnly', 'none'])
        .optional()
        .describe(
            'Guests who should receive notifications about the event update. all: all guests, externalOnly: non-Google Calendar guests only, none: no notifications',
        ),

    supportsAttachments: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether API client performing operation supports event attachments'),
});

// Update event request body schema (similar to create but allows more fields and includes some update-specific ones)
export const UpdateEventRequestSchema = z
    .object({
        // Required properties (same as create)
        start: EventDateTimeSchema.describe(
            'The (inclusive) start time of the event. For a recurring event, this is the start time of the first instance',
        ),

        end: EventDateTimeSchema.describe(
            'The (exclusive) end time of the event. For a recurring event, this is the end time of the first instance',
        ),

        // Optional properties - includes all writable fields from the full event schema
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
            .describe('Status of the event'),

        transparency: z
            .enum(['opaque', 'transparent'])
            .optional()
            .describe(
                'Whether the event blocks time on the calendar. opaque = busy, transparent = available',
            ),

        visibility: z
            .enum(['default', 'public', 'private', 'confidential'])
            .optional()
            .describe('Visibility of the event'),

        recurrence: z
            .array(z.string())
            .optional()
            .describe(
                'List of RRULE, EXRULE, RDATE and EXDATE lines for a recurring event, as specified in RFC5545',
            ),

        originalStartTime: EventDateTimeSchema.optional().describe(
            'For an instance of a recurring event, this is the time at which this event would start according to the recurrence data',
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
                        .describe('Whether this is an optional attendee'),

                    resource: z
                        .boolean()
                        .optional()
                        .describe(
                            'Whether the attendee is a resource. Can only be set when first added, subsequent modifications are ignored',
                        ),

                    responseStatus: z
                        .enum(['needsAction', 'declined', 'tentative', 'accepted'])
                        .optional()
                        .describe("The attendee's response status"),

                    comment: z.string().optional().describe("The attendee's response comment"),

                    additionalGuests: z
                        .number()
                        .int()
                        .min(0)
                        .optional()
                        .describe('Number of additional guests'),
                }),
            )
            .optional()
            .describe('The attendees of the event'),

        attendeesOmitted: z
            .boolean()
            .optional()
            .describe(
                "Whether attendees may have been omitted from the event's representation. When updating, this can be used to only update the participant's response",
            ),

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
            .describe('Whether anyone can invite themselves to the event'),

        guestsCanInviteOthers: z
            .boolean()
            .optional()
            .describe('Whether attendees other than the organizer can invite others to the event'),

        guestsCanModify: z
            .boolean()
            .optional()
            .describe('Whether attendees other than the organizer can modify the event'),

        guestsCanSeeOtherGuests: z
            .boolean()
            .optional()
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
                        .describe('URL link to the attachment. Required when adding an attachment'),

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

                    fileId: z
                        .string()
                        .optional()
                        .describe('ID of the attached file. Read-only for existing attachments'),
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

        // Update-specific: eventType is not included as it cannot be modified after creation
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
    );

// Update event response schema (returns the updated event)
export const UpdateEventResponseSchema = GoogleCalendarEventSchema.describe(
    'Updated calendar event resource',
);

// Combined update event schema (options + request body)
export const UpdateEventSchema = z.object({
    options: UpdateEventOptionsSchema.describe('Query parameters for the update event request'),

    event: UpdateEventRequestSchema.describe('Updated event data'),
});
