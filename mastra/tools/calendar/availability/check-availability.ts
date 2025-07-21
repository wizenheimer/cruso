import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { createTool } from '@mastra/core/tools';
import z from 'zod';

/**
 * The input schema for the list availability tool
 */
const checkAvailabilityInputSchema = z.object({
    timeStartRFC3339: z
        .string()
        .describe('Start date/time to check from (RFC3339 format) e.g. 2023-10-27T10:00:00Z'),
    timeEndRFC3339: z
        .string()
        .describe(
            'End date/time to check until (RFC3339 format) e.g. 2023-10-27T11:00:00Z (inclusive)',
        ),
    timeDurationMinutes: z
        .number()
        .describe('Desired duration of the free slot in minutes e.g. 60'),
    responseTimezone: z.string().describe('Timezone to use for the response e.g. Europe/Paris'),
    includeEvents: z.boolean().describe('Whether to include events in the response e.g. true'),
});

/**
 * The output schema for the list availability tool
 */
const checkAvailabilityOutputSchema = z.object({
    isAvailable: z.boolean().describe('Whether the time slot is available'),
    timezone: z.string().describe('Timezone to use for the response'),
    busySlots: z
        .array(
            z.object({
                start: z.string().describe('Start date/time of the busy slot (RFC3339 format)'),
                end: z.string().describe('End date/time of the busy slot (RFC3339 format)'),
            }),
        )
        .describe('Busy slots in the time slot'),
    freeSlots: z
        .array(
            z.object({
                start: z.string().describe('Start date/time of the free slot (RFC3339 format)'),
                end: z.string().describe('End date/time of the free slot (RFC3339 format)'),
            }),
        )
        .describe('Free slots in the time slot'),
    events: z
        .array(
            z.object({
                id: z.string().describe('ID of the event'),
                summary: z.string().describe('Summary of the event'),
                start: z.string().describe('Start date/time of the event (RFC3339 format)'),
                end: z.string().describe('End date/time of the event (RFC3339 format)'),
                calendarId: z.string().describe('ID of the calendar the event belongs to'),
                calendarName: z.string().describe('Name of the calendar the event belongs to'),
            }),
        )
        .describe('Events in the time slot'),
});

/**
 * List availability for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The list of availability slots
 */
export const checkAvailabilityTool = createTool({
    id: 'check-availability',
    description: 'Check availability for the current user',
    inputSchema: checkAvailabilityInputSchema,
    outputSchema: checkAvailabilityOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const {
            timeStartRFC3339,
            timeEndRFC3339,
            timeDurationMinutes,
            responseTimezone,
            includeEvents,
        } = context;
        const user = getUserFromRuntimeContext(runtimeContext);
        const calendarService = new GoogleCalendarService(user.id);
        const availabilityOptions = {
            responseTimezone,
            timeDurationMinutes,
            includeEvents,
        };
        const availability = await calendarService.checkAvailabilityBlock(
            timeStartRFC3339,
            timeEndRFC3339,
            availabilityOptions,
        );
        return {
            ...availability,
        };
    },
});
