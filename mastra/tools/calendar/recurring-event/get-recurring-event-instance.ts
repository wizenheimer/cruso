import { createTool } from '@mastra/core/tools';
import z from 'zod';
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
    id: z.string().describe('Event ID'),
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
 * The input schema for the get recurring event instances tool
 */
const getRecurringEventInstancesInputSchema = z.object({
    eventId: z.string().describe('ID of the recurring event series'),
    timeMin: z.string().describe('Start time for the search range (RFC3339 format)'),
    timeMax: z.string().describe('End time for the search range (RFC3339 format)'),
    options: z
        .object({
            maxResults: z.number().optional().describe('Maximum number of instances to return'),
            pageToken: z.string().optional().describe('Token for next page of results'),
            timeZone: z
                .string()
                .optional()
                .describe('Time zone for the search (IANA timezone identifier)'),
            showDeleted: z.boolean().optional().describe('Whether to include deleted instances'),
        })
        .optional()
        .describe('Search options'),
});

/**
 * The output schema for the get recurring event instances tool
 */
const getRecurringEventInstancesOutputSchema = z.object({
    state: z.enum(['success', 'failed']).describe('The state of the instances retrieval'),
    instances: z
        .array(
            z.object({
                id: z.string().describe('Event instance ID'),
                summary: z.string().describe('Event title/summary'),
                start: z.string().describe('Start time (RFC3339 format)'),
                end: z.string().describe('End time (RFC3339 format)'),
                location: z.string().optional().describe('Event location'),
                description: z.string().optional().describe('Event description'),
                attendees: z
                    .array(z.string())
                    .optional()
                    .describe('List of attendee email addresses'),
                status: z
                    .string()
                    .optional()
                    .describe('Event status: confirmed, tentative, cancelled'),
                recurringEventId: z
                    .string()
                    .optional()
                    .describe('ID of the recurring event series'),
                originalStartTime: z
                    .string()
                    .optional()
                    .describe('Original start time for this instance'),
                iCalUID: z.string().optional().describe('iCal UID of the event'),
            }),
        )
        .describe('List of recurring event instances'),
    nextPageToken: z.string().optional().describe('Token for next page of results'),
    calendarId: z
        .string()
        .optional()
        .describe('The calendar ID where the instances were retrieved from'),
    totalInstances: z.number().describe('Total number of instances found'),
});

/**
 * Get recurring event instances from google calendar for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The recurring event instances details
 */
export const getRecurringEventInstancesTool = createTool({
    id: 'get-recurring-event-instances',
    description: 'Get recurring event instances from google calendar for the current user',
    inputSchema: getRecurringEventInstancesInputSchema,
    outputSchema: getRecurringEventInstancesOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { eventId, timeMin, timeMax, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('User is required');
        }

        console.log(
            'triggered get recurring event instances tool',
            eventId,
            timeMin,
            timeMax,
            options,
            user,
        );

        try {
            const calendarService = new GoogleCalendarService(user.id);
            const result = await calendarService.getRecurringEventInstancesInPrimaryCalendar(
                eventId,
                timeMin,
                timeMax,
                options,
            );

            // Transform CalendarEvent instances to simplified format
            const instances = result.instances.map((instance) => ({
                id: instance.id || '',
                summary: instance.summary,
                start: instance.start.dateTime || instance.start.date || '',
                end: instance.end.dateTime || instance.end.date || '',
                location: instance.location,
                description: instance.description,
                attendees: instance.attendees?.map((attendee) => attendee.email),
                status: instance.status,
                recurringEventId: instance.recurringEventId,
                originalStartTime:
                    instance.originalStartTime?.dateTime || instance.originalStartTime?.date,
                iCalUID: instance.iCalUID,
            }));

            return {
                state: 'success' as const,
                instances: instances,
                nextPageToken: result.nextPageToken,
                calendarId: result.calendarId,
                totalInstances: instances.length,
            };
        } catch (error) {
            console.error('Failed to get recurring event instances:', error);
            return {
                state: 'failed' as const,
                instances: [],
                totalInstances: 0,
            };
        }
    },
});
