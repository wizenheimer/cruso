import { createTool } from '@mastra/core/tools';
import z from 'zod';

/**
 * The input schema for the list availability tool
 */
const listAvailabilityInputSchema = z.object({
    startDate: z.string().describe('Start date/time to check from (RFC3339 format)'),
    endDate: z.string().describe('End date/time to check until (RFC3339 format)'),
    duration: z.number().min(1).describe('Desired duration of the free slot in minutes'),
    minStartHour: z
        .number()
        .min(0)
        .max(23)
        .optional()
        .default(9)
        .describe('Minimum hour of day to consider (0-23)'),
    maxEndHour: z
        .number()
        .min(0)
        .max(23)
        .optional()
        .default(17)
        .describe('Maximum hour of day to consider (0-23), exclusive'),
    excludeSlots: z
        .array(
            z.object({
                start: z.string(),
                end: z.string(),
            }),
        )
        .optional()
        .describe('Slots to exclude from the availability list'),
    maxResults: z
        .number()
        .min(1)
        .max(3)
        .optional()
        .default(3)
        .describe('Maximum number of results to return'),
});

/**
 * The output schema for the list availability tool
 */
const listAvailabilityOutputSchema = z.array(
    z.object({
        start: z.string(),
        end: z.string(),
    }),
);

/**
 * List availability for the current user
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The list of availability slots
 */
export const listAvailabilityTool = createTool({
    id: 'list-availability',
    description: 'List availability for the current user',
    inputSchema: listAvailabilityInputSchema,
    outputSchema: listAvailabilityOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const { startDate, endDate, duration, minStartHour, maxEndHour, excludeSlots, maxResults } =
            context;
        const userId = runtimeContext.get('userId');
        if (!userId) {
            throw new Error('User ID is required');
        }
        console.log(
            'triggered list availability tool',
            startDate,
            endDate,
            duration,
            minStartHour,
            maxEndHour,
            excludeSlots,
            maxResults,
            userId,
        );
        return [
            {
                start: '2023-10-27T10:00:00Z',
                end: '2023-10-27T11:00:00Z',
            },
        ];
    },
});
