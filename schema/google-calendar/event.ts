import { z } from 'zod';

// DateTime schema for event times
export const EventDateTimeSchema = z
    .object({
        date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional()
            .describe('The date, in the format "yyyy-mm-dd", if this is an all-day event'),

        dateTime: z
            .string()
            .datetime()
            .optional()
            .describe(
                'The time, as a combined date-time value (formatted according to RFC3339). A time zone offset is required unless a time zone is explicitly specified in timeZone',
            ),

        timeZone: z
            .string()
            .optional()
            .describe(
                'The time zone in which the time is specified. (Formatted as an IANA Time Zone Database name, e.g. "Europe/Zurich")',
            ),
    })
    .refine(
        (data) => {
            // Either date OR dateTime must be present, but not both
            return (data.date && !data.dateTime) || (!data.date && data.dateTime);
        },
        {
            message: "Either 'date' or 'dateTime' must be specified, but not both",
        },
    );

// Person schema for creator, organizer, and attendees
const PersonSchema = z.object({
    id: z.string().optional().describe("The person's Profile ID, if available"),

    email: z
        .string()
        .email()
        .optional()
        .describe(
            "The person's email address, if available. Must be a valid email address as per RFC5322",
        ),

    displayName: z.string().optional().describe("The person's name, if available"),

    self: z
        .boolean()
        .optional()
        .default(false)
        .describe(
            'Whether this entry represents the calendar on which this copy of the event appears. Read-only',
        ),
});

// Creator schema (read-only)
const CreatorSchema = PersonSchema.extend({}).describe('The creator of the event. Read-only');

// Organizer schema
const OrganizerSchema = PersonSchema.extend({}).describe('The organizer of the event');

// Attendee schema
const AttendeeSchema = PersonSchema.extend({
    organizer: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether the attendee is the organizer of the event. Read-only'),

    resource: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether the attendee is a resource. Can only be set when first added'),

    optional: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether this is an optional attendee'),

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
        .default(0)
        .describe('Number of additional guests'),
});

// Reminder schema
const ReminderSchema = z.object({
    method: z.enum(['email', 'popup']).describe('The method used by this reminder'),

    minutes: z
        .number()
        .int()
        .min(0)
        .max(40320)
        .describe(
            'Number of minutes before the start of the event when the reminder should trigger. Valid values are between 0 and 40320 (4 weeks in minutes)',
        ),
});

// Reminders schema
const RemindersSchema = z.object({
    useDefault: z
        .boolean()
        .describe('Whether the default reminders of the calendar apply to the event'),

    overrides: z
        .array(ReminderSchema)
        .max(5)
        .optional()
        .describe(
            "If the event doesn't use default reminders, this lists the reminders specific to the event. Maximum 5 override reminders",
        ),
});

// Extended properties schema
const ExtendedPropertiesSchema = z.object({
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
});

// Conference entry point schema
const ConferenceEntryPointSchema = z.object({
    entryPointType: z
        .enum(['video', 'phone', 'sip', 'more'])
        .describe('The type of the conference entry point'),

    uri: z.string().max(1300).describe('The URI of the entry point. Maximum 1300 characters'),

    label: z
        .string()
        .max(512)
        .optional()
        .describe('The label for the URI. Visible to end users. Maximum 512 characters'),

    pin: z
        .string()
        .max(128)
        .optional()
        .describe('The PIN to access the conference. Maximum 128 characters'),

    accessCode: z
        .string()
        .max(128)
        .optional()
        .describe('The access code to access the conference. Maximum 128 characters'),

    meetingCode: z
        .string()
        .max(128)
        .optional()
        .describe('The meeting code to access the conference. Maximum 128 characters'),

    passcode: z
        .string()
        .max(128)
        .optional()
        .describe('The passcode to access the conference. Maximum 128 characters'),

    password: z
        .string()
        .max(128)
        .optional()
        .describe('The password to access the conference. Maximum 128 characters'),
});

// Conference solution key schema
const ConferenceSolutionKeySchema = z.object({
    type: z
        .enum(['eventHangout', 'eventNamedHangout', 'hangoutsMeet', 'addOn'])
        .describe('The conference solution type'),
});

// Conference solution schema
const ConferenceSolutionSchema = z.object({
    key: ConferenceSolutionKeySchema.describe(
        'The key which can uniquely identify the conference solution',
    ),

    name: z.string().optional().describe('The user-visible name of this solution'),

    iconUri: z.string().url().optional().describe('The user-visible icon for this solution'),
});

// Conference create request status schema
const ConferenceCreateRequestStatusSchema = z.object({
    statusCode: z
        .enum(['pending', 'success', 'failure'])
        .describe('The current status of the conference create request. Read-only'),
});

// Conference create request schema
const ConferenceCreateRequestSchema = z.object({
    requestId: z.string().describe('The client-generated unique ID for this request'),

    conferenceSolutionKey: ConferenceSolutionKeySchema.describe(
        'The conference solution, such as Hangouts or Google Meet',
    ),

    status: ConferenceCreateRequestStatusSchema.optional().describe(
        'The status of the conference create request',
    ),
});

// Conference data schema
export const ConferenceDataSchema = z
    .object({
        createRequest: ConferenceCreateRequestSchema.optional().describe(
            'A request to generate a new conference and attach it to the event',
        ),

        entryPoints: z
            .array(ConferenceEntryPointSchema)
            .optional()
            .describe('Information about individual conference entry points'),

        conferenceSolution: ConferenceSolutionSchema.optional().describe(
            'The conference solution, such as Google Meet',
        ),

        conferenceId: z.string().optional().describe('The ID of the conference'),

        signature: z
            .string()
            .optional()
            .describe('The signature of the conference data. Generated on server side'),

        notes: z
            .string()
            .max(2048)
            .optional()
            .describe(
                'Additional notes to display to the user. Can contain HTML. Maximum 2048 characters',
            ),
    })
    .refine(
        (data) => {
            // Either (conferenceSolution AND at least one entryPoint) OR createRequest is required
            const hasConferenceSolution = !!data.conferenceSolution;
            const hasEntryPoints = !!data.entryPoints && data.entryPoints.length > 0;
            const hasCreateRequest = !!data.createRequest;

            return (hasConferenceSolution && hasEntryPoints) || hasCreateRequest;
        },
        {
            message:
                'Either conferenceSolution with at least one entryPoint, or createRequest is required',
        },
    );

// Attachment schema
const AttachmentSchema = z.object({
    fileUrl: z
        .string()
        .url()
        .describe('URL link to the attachment. Required when adding an attachment'),

    title: z.string().optional().describe('Attachment title'),

    mimeType: z.string().optional().describe('Internet media type (MIME type) of the attachment'),

    iconLink: z.string().url().optional().describe("URL link to the attachment's icon"),

    fileId: z
        .string()
        .optional()
        .describe(
            'ID of the attached file. Read-only. For Google Drive files, this is the ID of the corresponding Files resource',
        ),
});

// Source schema
const SourceSchema = z.object({
    url: z
        .string()
        .url()
        .describe('URL of the source pointing to a resource. The URL scheme must be HTTP or HTTPS'),

    title: z
        .string()
        .optional()
        .describe('Title of the source; for example a title of a web page or an email subject'),
});

// Working location schemas
const CustomLocationSchema = z.object({
    label: z.string().optional().describe('An optional extra label for additional information'),
});

const OfficeLocationSchema = z.object({
    buildingId: z
        .string()
        .optional()
        .describe(
            "An optional building identifier. Should reference a building ID in the organization's Resources database",
        ),

    floorId: z.string().optional().describe('An optional floor identifier'),

    floorSectionId: z.string().optional().describe('An optional floor section identifier'),

    deskId: z.string().optional().describe('An optional desk identifier'),

    label: z
        .string()
        .optional()
        .describe(
            "The office name that's displayed in Calendar clients. Recommend referencing a building name in the organization's Resources database",
        ),
});

export const WorkingLocationPropertiesSchema = z.object({
    type: z
        .enum(['homeOffice', 'officeLocation', 'customLocation'])
        .describe('Type of the working location. Required when adding working location properties'),

    homeOffice: z
        .any()
        .optional()
        .describe('If present, specifies that the user is working at home'),

    customLocation: CustomLocationSchema.optional().describe(
        'If present, specifies that the user is working from a custom location',
    ),

    officeLocation: OfficeLocationSchema.optional().describe(
        'If present, specifies that the user is working from an office',
    ),
});

// Out of office properties schema
export const OutOfOfficePropertiesSchema = z.object({
    autoDeclineMode: z
        .enum([
            'declineNone',
            'declineAllConflictingInvitations',
            'declineOnlyNewConflictingInvitations',
        ])
        .optional()
        .describe('Whether to decline meeting invitations which overlap Out of office events'),

    declineMessage: z
        .string()
        .optional()
        .describe(
            'Response message to set if an existing event or new invitation is automatically declined',
        ),
});

// Focus time properties schema
export const FocusTimePropertiesSchema = z.object({
    autoDeclineMode: z
        .enum([
            'declineNone',
            'declineAllConflictingInvitations',
            'declineOnlyNewConflictingInvitations',
        ])
        .optional()
        .describe('Whether to decline meeting invitations which overlap Focus Time events'),

    declineMessage: z
        .string()
        .optional()
        .describe(
            'Response message to set if an existing event or new invitation is automatically declined',
        ),

    chatStatus: z
        .enum(['available', 'doNotDisturb'])
        .optional()
        .describe('The status to mark the user in Chat and related products'),
});

// Birthday properties schema
const BirthdayPropertiesSchema = z.object({
    contact: z
        .string()
        .optional()
        .describe(
            'Resource name of the contact this birthday event is linked to. Format: "people/c12345". Read-only',
        ),

    type: z
        .enum(['anniversary', 'birthday', 'custom', 'other', 'self'])
        .optional()
        .default('birthday')
        .describe(
            'Type of birthday or special event. The Calendar API only supports creating events with type "birthday"',
        ),

    customTypeName: z
        .string()
        .optional()
        .describe(
            'Custom type label specified for this event. Populated if type is set to "custom". Read-only',
        ),
});

// Main Event schema
export const GoogleCalendarEventSchema = z.object({
    kind: z.literal('calendar#event').describe('Type of the resource'),

    etag: z.string().describe('ETag of the resource'),

    id: z
        .string()
        .min(5)
        .max(1024)
        .regex(/^[a-v0-9]+$/)
        .optional()
        .describe(
            'Opaque identifier of the event. Must follow base32hex encoding rules, length 5-1024 characters',
        ),

    status: z
        .enum(['confirmed', 'tentative', 'cancelled'])
        .optional()
        .default('confirmed')
        .describe('Status of the event'),

    htmlLink: z
        .string()
        .url()
        .optional()
        .describe('An absolute link to this event in the Google Calendar Web UI. Read-only'),

    created: z
        .string()
        .datetime()
        .optional()
        .describe('Creation time of the event (as a RFC3339 timestamp). Read-only'),

    updated: z
        .string()
        .datetime()
        .optional()
        .describe(
            'Last modification time of the main event data (as a RFC3339 timestamp). Read-only',
        ),

    summary: z.string().optional().describe('Title of the event'),

    description: z.string().optional().describe('Description of the event. Can contain HTML'),

    location: z.string().optional().describe('Geographic location of the event as free-form text'),

    colorId: z
        .string()
        .optional()
        .describe(
            'The color of the event. This is an ID referring to an entry in the event section of the colors definition',
        ),

    creator: CreatorSchema.optional().describe('The creator of the event. Read-only'),

    organizer: OrganizerSchema.optional().describe('The organizer of the event'),

    start: EventDateTimeSchema.describe(
        'The (inclusive) start time of the event. For a recurring event, this is the start time of the first instance',
    ),

    end: EventDateTimeSchema.describe(
        'The (exclusive) end time of the event. For a recurring event, this is the end time of the first instance',
    ),

    endTimeUnspecified: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether the end time is actually unspecified'),

    recurrence: z
        .array(z.string())
        .optional()
        .describe(
            'List of RRULE, EXRULE, RDATE and EXDATE lines for a recurring event, as specified in RFC5545',
        ),

    recurringEventId: z
        .string()
        .optional()
        .describe(
            'For an instance of a recurring event, this is the id of the recurring event to which this instance belongs. Immutable',
        ),

    originalStartTime: EventDateTimeSchema.optional().describe(
        'For an instance of a recurring event, this is the time at which this event would start according to the recurrence data. Immutable',
    ),

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

    iCalUID: z
        .string()
        .optional()
        .describe(
            'Event unique identifier as defined in RFC5545. Used to uniquely identify events across calendaring systems',
        ),

    sequence: z.number().int().optional().describe('Sequence number as per iCalendar'),

    attendees: z.array(AttendeeSchema).optional().describe('The attendees of the event'),

    attendeesOmitted: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether attendees may have been omitted from the event's representation"),

    extendedProperties: ExtendedPropertiesSchema.optional().describe(
        'Extended properties of the event',
    ),

    hangoutLink: z
        .string()
        .url()
        .optional()
        .describe('An absolute link to the Google Hangout associated with this event. Read-only'),

    conferenceData: ConferenceDataSchema.optional().describe(
        'The conference-related information, such as details of a Google Meet conference',
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

    privateCopy: z
        .boolean()
        .optional()
        .default(false)
        .describe('If set to True, Event propagation is disabled. Immutable'),

    locked: z
        .boolean()
        .optional()
        .default(false)
        .describe(
            'Whether this is a locked event copy where no changes can be made to main event fields. Read-only',
        ),

    reminders: RemindersSchema.optional().describe(
        "Information about the event's reminders for the authenticated user",
    ),

    source: SourceSchema.optional().describe(
        'Source from which the event was created. Can only be seen or modified by the creator',
    ),

    workingLocationProperties: WorkingLocationPropertiesSchema.optional().describe(
        'Working location event data',
    ),

    outOfOfficeProperties: OutOfOfficePropertiesSchema.optional().describe(
        'Out of office event data. Used if eventType is outOfOffice',
    ),

    focusTimeProperties: FocusTimePropertiesSchema.optional().describe(
        'Focus Time event data. Used if eventType is focusTime',
    ),

    attachments: z
        .array(AttachmentSchema)
        .max(25)
        .optional()
        .describe('File attachments for the event. Maximum 25 attachments per event'),

    birthdayProperties: BirthdayPropertiesSchema.optional().describe(
        'Birthday or special event data. Used if eventType is "birthday". Immutable',
    ),

    eventType: z
        .enum(['birthday', 'default', 'focusTime', 'fromGmail', 'outOfOffice', 'workingLocation'])
        .optional()
        .default('default')
        .describe('Specific type of the event. Cannot be modified after creation'),
});
