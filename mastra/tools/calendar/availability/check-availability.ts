import { getUserFromRuntimeContext } from '@/mastra/commons';
import { GoogleCalendarService } from '@/services/calendar';
import { createTool } from '@mastra/core/tools';
import {
    checkAvailabilityInputSchema,
    checkAvailabilityOutputSchema,
} from '@/types/tools/availability';

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
