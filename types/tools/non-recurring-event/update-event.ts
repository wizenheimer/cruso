import z from 'zod';

// CalendarEvent schema based on the CalendarEvent interface
export const calendarEventDateTimeSchema = z.object({
    dateTime: z.string().optional().describe('RFC3339 timestamp'),
    date: z.string().optional().describe('Date in YYYY-MM-DD format'),
    timeZone: z.string().optional().describe('IANA timezone identifier'),
});

export const calendarEventAttendeeSchema = z.object({
    email: z.string().describe('Attendee email address'),
    displayName: z.string().optional().describe('Attendee display name'),
    responseStatus: z.string().optional().describe('Response status'),
    optional: z.boolean().optional().describe('Whether attendance is optional'),
    resource: z.boolean().optional().describe('Whether this is a resource'),
    organizer: z.boolean().optional().describe('Whether this is the organizer'),
    self: z.boolean().optional().describe('Whether this is the current user'),
    comment: z.string().optional().describe('Attendee comment'),
    additionalGuests: z.number().optional().describe('Number of additional guests'),
});

export const calendarEventSchema = z.object({
    id: z.string().optional().describe('Event ID'),
    summary: z.string().describe('Event title/summary'),
    description: z.string().optional().describe('Event description'),
    start: calendarEventDateTimeSchema.describe('Start date and time'),
    end: calendarEventDateTimeSchema.describe('End date and time'),
    attendees: z.array(calendarEventAttendeeSchema).optional().describe('List of event attendees'),
    location: z.string().optional().describe('Event location'),
    reminders: z
        .object({
            useDefault: z.boolean().optional().describe('Use default reminders'),
            overrides: z
                .array(
                    z.object({
                        method: z.string().describe('Reminder method'),
                        minutes: z.number().describe('Minutes before event'),
                    }),
                )
                .optional()
                .describe('Custom reminder overrides'),
        })
        .optional()
        .describe('Reminder settings'),
    // Additional optional fields
    recurringEventId: z.string().optional().describe('ID of the recurring event series'),
    originalStartTime: calendarEventDateTimeSchema
        .optional()
        .describe('Original start time for recurring events'),
    status: z.string().optional().describe('Event status: confirmed, tentative, cancelled'),
    organizer: z
        .object({
            email: z.string().optional().describe('Organizer email'),
            displayName: z.string().optional().describe('Organizer display name'),
            self: z.boolean().optional().describe('Whether current user is organizer'),
        })
        .optional()
        .describe('Event organizer'),
    creator: z
        .object({
            email: z.string().optional().describe('Creator email'),
            displayName: z.string().optional().describe('Creator display name'),
            self: z.boolean().optional().describe('Whether current user is creator'),
        })
        .optional()
        .describe('Event creator'),
    transparency: z.string().optional().describe('Event transparency: opaque, transparent'),
    visibility: z
        .string()
        .optional()
        .describe('Event visibility: default, public, private, confidential'),
    iCalUID: z.string().optional().describe('iCal UID'),
    colorId: z.string().optional().describe('Event color ID'),
    extendedProperties: z
        .object({
            private: z.record(z.string()).optional().describe('Private extended properties'),
            shared: z.record(z.string()).optional().describe('Shared extended properties'),
        })
        .optional()
        .describe('Extended properties'),
});

export const updateEventInputSchema = z.object({
    eventId: z.string().describe('ID of the event to update'),
    summary: z.string().optional().describe('Updated event title'),
    start: z.string().optional().describe('Updated start time (RFC3339 format)'),
    end: z.string().optional().describe('Updated end time (RFC3339 format)'),
    location: z.string().optional().describe('Updated event location'),
    description: z.string().optional().describe('Updated event description'),
    attendees: z
        .array(z.string().email())
        .optional()
        .describe('Updated list of attendee email addresses'),
    notifyAttendees: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to notify attendees of the update'),
    options: z
        .object({
            sendUpdates: z
                .enum(['all', 'externalOnly', 'none'])
                .optional()
                .describe('How to send updates to attendees'),
        })
        .optional()
        .describe('Update event options'),
});

export const updateEventOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event update'),
    eventId: z.string().optional().describe('The id of the event updated'),
    eventTitle: z.string().optional().describe('The title of the event updated'),
    eventStart: z.string().optional().describe('Updated start time (RFC3339 format)'),
    eventEnd: z.string().optional().describe('Updated end time (RFC3339 format)'),
    eventLocation: z.string().optional().describe('Updated event location'),
    eventDescription: z.string().optional().describe('Updated event description'),
    eventAttendees: z
        .array(z.string().email())
        .optional()
        .describe('Updated list of attendee email addresses'),
    calendarId: z.string().optional().describe('The calendar ID where the event was updated'),
});
