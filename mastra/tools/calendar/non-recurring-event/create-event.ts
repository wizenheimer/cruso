import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { User } from '@/types/api/users';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';

// CalendarEvent schema based on the CalendarEvent interface
const calendarEventDateTimeSchema = z.object({
    dateTime: z.string().optional().describe('RFC3339 timestamp'),
    date: z.string().optional().describe('Date in YYYY-MM-DD format'),
    timeZone: z.string().optional().describe('IANA timezone identifier'),
});

const calendarEventAttendeeSchema = z.object({
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

const calendarEventSchema = z.object({
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

/**
 * The input schema for the create event tool
 */
const createEventInputSchema = z.object({
    title: z.string().describe('Event title'),
    start: z.string().describe('Start time (RFC3339 format, e.g., 2023-10-27T10:00:00Z)'),
    end: z.string().describe('End time (RFC3339 format, e.g., 2023-10-27T11:00:00Z)'),
    location: z.string().optional().describe('Event location'),
    description: z.string().optional().describe('Event description'),
    attendees: z.array(z.string().email()).optional().describe('List of attendee email addresses'),
    conferenceData: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether to add Google Meet videoconference'),
    allDay: z
        .boolean()
        .optional()
        .default(false)
        .describe(
            'Whether this is an all-day event. If true, start/end should be dates like YYYY-MM-DD',
        ),
    options: z
        .object({
            sendUpdates: z
                .enum(['all', 'externalOnly', 'none'])
                .optional()
                .describe('How to send updates to attendees'),
            conferenceDataVersion: z.number().optional().describe('Conference data version'),
        })
        .optional()
        .describe('Event creation options'),
});

/**
 * The output schema for the create event tool
 */
const createEventOutputSchema = z.object({
    state: z
        .enum(['soft-conflict', 'hard-conflict', 'success', 'failed'])
        .describe('The state of the event creation'),
    eventId: z.string().optional().describe('The id of the event created'),
    eventLink: z.string().optional().describe('The link to the event'),
    eventTitle: z.string().describe('Event title'),
    eventStart: z.string().describe('Start time (RFC3339 format, e.g., 2023-10-27T10:00:00Z)'),
    eventEnd: z.string().describe('End time (RFC3339 format, e.g., 2023-10-27T11:00:00Z)'),
    eventLocation: z.string().optional().describe('Event location'),
    eventDescription: z.string().optional().describe('Event description'),
    eventAttendees: z
        .array(z.string().email())
        .optional()
        .describe('List of attendee email addresses'),
    eventConferenceData: z
        .boolean()
        .optional()
        .describe('Whether to add Google Meet videoconference'),
    eventAllDay: z
        .boolean()
        .optional()
        .describe(
            'Whether this is an all-day event. If true, start/end should be dates like YYYY-MM-DD',
        ),
    calendarId: z.string().optional().describe('The calendar ID where the event was created'),
});

/**
 * Create a new event in google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The created event details
 */
export const createEventTool = createTool({
    id: 'create-event',
    description: 'Create a new event in google calendar for the current user',
    inputSchema: createEventInputSchema,
    outputSchema: createEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const {
            title,
            start,
            end,
            location,
            description,
            attendees,
            conferenceData,
            allDay,
            options,
        } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log(
            'triggered create event tool',
            title,
            start,
            end,
            location,
            description,
            attendees,
            conferenceData,
            allDay,
            user,
        );

        try {
            const calendarService = new GoogleCalendarService(user.id);

            // Convert input to CalendarEvent format
            const calendarEvent = {
                summary: title,
                description,
                start: allDay ? { date: start } : { dateTime: start },
                end: allDay ? { date: end } : { dateTime: end },
                location,
                attendees: attendees?.map((email) => ({ email })),
                // Add conference data if requested
                ...(conferenceData && {
                    conferenceData: {
                        createRequest: {
                            requestId: `meet-${Date.now()}`,
                            conferenceSolutionKey: {
                                type: 'hangoutsMeet',
                            },
                        },
                    },
                }),
            };

            const createdEvent = await calendarService.createEventInPrimaryCalendar(
                calendarEvent,
                options,
            );

            return {
                state: 'success' as const,
                eventId: createdEvent.id,
                eventLink:
                    createdEvent.htmlLink ||
                    `https://calendar.google.com/event?event=${createdEvent.id}`,
                eventTitle: createdEvent.summary,
                eventStart: createdEvent.start.dateTime || createdEvent.start.date || start,
                eventEnd: createdEvent.end.dateTime || createdEvent.end.date || end,
                eventLocation: createdEvent.location,
                eventDescription: createdEvent.description,
                eventAttendees: createdEvent.attendees?.map((a) => a.email),
                eventConferenceData: conferenceData,
                eventAllDay: allDay,
                calendarId: createdEvent.calendarId,
            };
        } catch (error) {
            console.error('Failed to create event:', error);
            return {
                state: 'failed' as const,
                eventTitle: title,
                eventStart: start,
                eventEnd: end,
                eventLocation: location,
                eventDescription: description,
                eventAttendees: attendees,
                eventConferenceData: conferenceData,
                eventAllDay: allDay,
            };
        }
    },
});
