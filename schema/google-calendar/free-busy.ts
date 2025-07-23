import { z } from 'zod';

// FreeBusy query item schema
const FreeBusyQueryItemSchema = z.object({
    id: z.string().describe('The identifier of a calendar or a group'),
});

// FreeBusy query request schema
export const FreeBusyQueryRequestSchema = z
    .object({
        timeMin: z
            .string()
            .datetime()
            .describe('The start of the interval for the query formatted as per RFC3339'),

        timeMax: z
            .string()
            .datetime()
            .describe('The end of the interval for the query formatted as per RFC3339'),

        timeZone: z
            .string()
            .optional()
            .default('UTC')
            .describe('Time zone used in the response. Default is UTC'),

        groupExpansionMax: z
            .number()
            .int()
            .min(1)
            .max(100)
            .optional()
            .describe(
                'Maximal number of calendar identifiers to be provided for a single group. Maximum value is 100',
            ),

        calendarExpansionMax: z
            .number()
            .int()
            .min(1)
            .max(50)
            .optional()
            .describe(
                'Maximal number of calendars for which FreeBusy information is to be provided. Maximum value is 50',
            ),

        items: z
            .array(FreeBusyQueryItemSchema)
            .describe('List of calendars and/or groups to query'),
    })
    .refine(
        (data) => {
            // Validation: timeMin must be before timeMax
            return new Date(data.timeMin) < new Date(data.timeMax);
        },
        {
            message: 'timeMin must be before timeMax',
            path: ['timeMin', 'timeMax'],
        },
    )
    .refine(
        (data) => {
            // Validation: respect calendarExpansionMax limit if specified
            if (data.calendarExpansionMax && data.items.length > data.calendarExpansionMax) {
                return false;
            }
            return true;
        },
        {
            message: 'Number of items cannot exceed calendarExpansionMax',
            path: ['items'],
        },
    );

// FreeBusy error schema
const FreeBusyErrorSchema = z.object({
    domain: z.string().describe('Domain, or broad category, of the error'),

    reason: z
        .enum(['groupTooBig', 'tooManyCalendarsRequested', 'notFound', 'internalError'])
        .or(z.string()) // Allow for future error types
        .describe(
            'Specific reason for the error. May include additional error types in the future',
        ),
});

// FreeBusy time range schema
const FreeBusyTimeRangeSchema = z
    .object({
        start: z.string().datetime().describe('The (inclusive) start of the time period'),

        end: z.string().datetime().describe('The (exclusive) end of the time period'),
    })
    .refine(
        (data) => {
            // Validation: start must be before end
            return new Date(data.start) < new Date(data.end);
        },
        {
            message: 'Start time must be before end time',
            path: ['start', 'end'],
        },
    );

// FreeBusy group expansion schema
const FreeBusyGroupExpansionSchema = z.object({
    errors: z
        .array(FreeBusyErrorSchema)
        .optional()
        .describe('Optional error(s) if computation for the group failed'),

    calendars: z
        .array(z.string())
        .optional()
        .describe("List of calendars' identifiers within a group"),
});

// FreeBusy calendar result schema
const FreeBusyCalendarResultSchema = z.object({
    errors: z
        .array(FreeBusyErrorSchema)
        .optional()
        .describe('Optional error(s) if computation for the calendar failed'),

    busy: z
        .array(FreeBusyTimeRangeSchema)
        .optional()
        .describe('List of time ranges during which this calendar should be regarded as busy'),
});

// FreeBusy query response schema
export const FreeBusyQueryResponseSchema = z
    .object({
        kind: z.literal('calendar#freeBusy').describe('Type of the resource'),

        timeMin: z.string().datetime().describe('The start of the interval'),

        timeMax: z.string().datetime().describe('The end of the interval'),

        groups: z
            .record(FreeBusyGroupExpansionSchema)
            .optional()
            .describe('Expansion of groups. Keys are group identifiers'),

        calendars: z
            .record(FreeBusyCalendarResultSchema)
            .optional()
            .describe('List of free/busy information for calendars. Keys are calendar identifiers'),
    })
    .refine(
        (data) => {
            // Validation: timeMin must be before timeMax in response
            return new Date(data.timeMin) < new Date(data.timeMax);
        },
        {
            message: 'Response timeMin must be before timeMax',
            path: ['timeMin', 'timeMax'],
        },
    );
