import { createTool } from '@mastra/core/tools';
import z from 'zod';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { CalendarEvent } from '@/services/calendar/base';

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
 * The input schema for the update recurring event instance tool
 */
const updateRecurringEventInstanceInputSchema = z.object({
    eventId: z.string().describe('ID of the recurring event series'),
    instanceStartTime: z
        .string()
        .describe('Start time of the specific instance to update (RFC3339 format)'),
    summary: z.string().optional().describe('Updated event title'),
    start: z.string().optional().describe('Updated start time (RFC3339 format)'),
    end: z.string().optional().describe('Updated end time (RFC3339 format)'),
    location: z.string().optional().describe('Updated event location'),
    description: z.string().optional().describe('Updated event description'),
    attendees: z
        .array(z.string().email())
        .optional()
        .describe('Updated list of attendee email addresses'),
    allDay: z
        .boolean()
        .optional()
        .describe(
            'Whether this is an all-day event. If true, start/end should be dates like YYYY-MM-DD',
        ),
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

/**
 * The output schema for the update recurring event instance tool
 */
const updateRecurringEventInstanceOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the event instance update'),
    eventId: z.string().optional().describe('The id of the updated event instance'),
    eventTitle: z.string().optional().describe('The title of the updated event instance'),
    eventStart: z.string().optional().describe('Updated start time (RFC3339 format)'),
    eventEnd: z.string().optional().describe('Updated end time (RFC3339 format)'),
    eventLocation: z.string().optional().describe('Updated event location'),
    eventDescription: z.string().optional().describe('Updated event description'),
    eventAttendees: z
        .array(z.string().email())
        .optional()
        .describe('Updated list of attendee email addresses'),
    eventStatus: z.string().optional().describe('Event status: confirmed, tentative, cancelled'),
    eventOrganizer: z
        .object({
            email: z.string().optional().describe('Organizer email'),
            displayName: z.string().optional().describe('Organizer display name'),
        })
        .optional()
        .describe('Event organizer'),
    eventCreator: z
        .object({
            email: z.string().optional().describe('Creator email'),
            displayName: z.string().optional().describe('Creator display name'),
        })
        .optional()
        .describe('Event creator'),
    eventLink: z.string().optional().describe('Link to the event'),
    eventICalUID: z.string().optional().describe('iCal UID of the event'),
    eventRecurringEventId: z.string().optional().describe('ID of the recurring event series'),
    eventOriginalStartTime: z.string().optional().describe('Original start time for this instance'),
    eventTransparency: z.string().optional().describe('Event transparency: opaque, transparent'),
    eventVisibility: z
        .string()
        .optional()
        .describe('Event visibility: default, public, private, confidential'),
    eventColorId: z.string().optional().describe('Event color ID'),
    eventCreated: z.string().optional().describe('Event creation timestamp'),
    eventUpdated: z.string().optional().describe('Event last update timestamp'),
    calendarId: z
        .string()
        .optional()
        .describe('The calendar ID where the event instance was updated'),
});

/**
 * Update a specific instance of a recurring event in google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The updated recurring event instance details
 */
export const updateRecurringEventInstanceTool = createTool({
    id: 'update-recurring-event-instance',
    description:
        'Update a specific instance of a recurring event in google calendar for the current user',
    inputSchema: updateRecurringEventInstanceInputSchema,
    outputSchema: updateRecurringEventInstanceOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const {
            eventId,
            instanceStartTime,
            summary,
            start,
            end,
            location,
            description,
            attendees,
            allDay,
            options,
        } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log(
            'triggered update recurring event instance tool',
            eventId,
            instanceStartTime,
            summary,
            start,
            end,
            location,
            description,
            attendees,
            allDay,
            user,
        );

        try {
            const calendarService = new GoogleCalendarService(user.id);

            // Convert input to CalendarEvent format
            const eventUpdates: Partial<CalendarEvent> = {};

            if (summary !== undefined) eventUpdates.summary = summary;
            if (description !== undefined) eventUpdates.description = description;
            if (location !== undefined) eventUpdates.location = location;

            if (start !== undefined) {
                eventUpdates.start = allDay ? { date: start } : { dateTime: start };
            }
            if (end !== undefined) {
                eventUpdates.end = allDay ? { date: end } : { dateTime: end };
            }

            if (attendees !== undefined) {
                eventUpdates.attendees = attendees.map((email) => ({ email }));
            }

            const updatedEvent =
                await calendarService.updateRecurringEventInstanceInPrimaryCalendar(
                    eventId,
                    instanceStartTime,
                    eventUpdates,
                    options,
                );

            return {
                state: 'success' as const,
                eventId: updatedEvent.id,
                eventTitle: updatedEvent.summary,
                eventStart: updatedEvent.start.dateTime || updatedEvent.start.date || start,
                eventEnd: updatedEvent.end.dateTime || updatedEvent.end.date || end,
                eventLocation: updatedEvent.location,
                eventDescription: updatedEvent.description,
                eventAttendees: updatedEvent.attendees?.map((attendee) => attendee.email),
                eventStatus: updatedEvent.status,
                eventOrganizer: updatedEvent.organizer
                    ? {
                          email: updatedEvent.organizer.email,
                          displayName: updatedEvent.organizer.displayName,
                      }
                    : undefined,
                eventCreator: updatedEvent.creator
                    ? {
                          email: updatedEvent.creator.email,
                          displayName: updatedEvent.creator.displayName,
                      }
                    : undefined,
                eventLink: updatedEvent.htmlLink,
                eventICalUID: updatedEvent.iCalUID,
                eventRecurringEventId: updatedEvent.recurringEventId,
                eventOriginalStartTime:
                    updatedEvent.originalStartTime?.dateTime ||
                    updatedEvent.originalStartTime?.date,
                eventTransparency: updatedEvent.transparency,
                eventVisibility: updatedEvent.visibility,
                eventColorId: updatedEvent.colorId,
                eventCreated: updatedEvent.created,
                eventUpdated: updatedEvent.updated,
                calendarId: updatedEvent.calendarId,
            };
        } catch (error) {
            console.error('Failed to update recurring event instance:', error);
            return {
                state: 'failed' as const,
                eventId: eventId,
                eventTitle: summary,
                eventStart: start,
                eventEnd: end,
                eventLocation: location,
                eventDescription: description,
                eventAttendees: attendees,
            };
        }
    },
});
