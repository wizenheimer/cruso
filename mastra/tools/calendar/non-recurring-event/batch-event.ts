import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { createTool } from '@mastra/core/tools';
import z from 'zod';

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

const performBatchEventInputSchema = z.object({
    operations: z
        .array(
            z.object({
                type: z.enum(['create', 'update', 'delete']).describe('Operation type'),
                eventId: z
                    .string()
                    .optional()
                    .describe('Event ID (required for update and delete operations)'),
                event: calendarEventSchema
                    .optional()
                    .describe('Event data (required for create and update operations)'),
            }),
        )
        .describe('Array of batch operations to perform'),
    options: z
        .object({
            sendUpdates: z
                .enum(['all', 'externalOnly', 'none'])
                .optional()
                .describe('How to send updates to attendees'),
        })
        .optional()
        .describe('Batch operation options'),
});

const performBatchEventOutputSchema = z.object({
    successful: z
        .array(
            z.object({
                operation: z
                    .object({
                        type: z.enum(['create', 'update', 'delete']).describe('Operation type'),
                        eventId: z.string().optional().describe('Event ID'),
                        event: calendarEventSchema.optional().describe('Event data'),
                    })
                    .describe('The operation that was performed'),
                result: z.any().optional().describe('Result of the operation'),
            }),
        )
        .describe('Successfully completed operations'),
    failed: z
        .array(
            z.object({
                operation: z
                    .object({
                        type: z.enum(['create', 'update', 'delete']).describe('Operation type'),
                        eventId: z.string().optional().describe('Event ID'),
                        event: calendarEventSchema.optional().describe('Event data'),
                    })
                    .describe('The operation that failed'),
                error: z.string().describe('Error message'),
            }),
        )
        .describe('Failed operations'),
});

export const performBatchEventTool = createTool({
    id: 'perform-batch-event',
    description:
        'Perform a batch of event operations (create, update, delete) in google calendar for the current user',
    inputSchema: performBatchEventInputSchema,
    outputSchema: performBatchEventOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { operations, options } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        const calendarService = new GoogleCalendarService(user.id);
        const results = await calendarService.performBatchOperationsOnPrimaryCalendar(
            operations,
            options,
        );
        return results;
    },
});
