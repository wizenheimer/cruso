import { GoogleCalendarService } from '@/services/calendar';
import { User } from '@/types/api/users';
import { createTool } from '@mastra/core/tools';
import {
    createAvailabilityInputSchema,
    createAvailabilityOutputSchema,
} from '@/types/tools/availability';

/**
 * Create availability for the current user during a specific time period by rescheduling existing events
 * @param context - The context of the tool
 * @param runtimeContext - The runtime context of the tool
 * @returns The state of the availability creation and the titles of the events that were rescheduled
 */
export const createAvailabilityTool = createTool({
    id: 'create-availability',
    description:
        'Create availability by rescheduling existing events and blocking time for the user',
    inputSchema: createAvailabilityInputSchema,
    outputSchema: createAvailabilityOutputSchema,
    execute: async ({ context, runtimeContext }) => {
        const {
            timeMinRFC3339,
            timeMaxRFC3339,
            timeDurationMinutes,
            responseTimezone,
            eventSummary,
            eventDescription,
            eventLocation,
            eventAttendees,
            eventConferenceEnabled,
            eventIsPrivate,
            eventCreateBlock,
        } = context;

        const user: User = runtimeContext.get('user');
        if (!user) {
            throw new Error('User is required');
        }

        const calendarService = new GoogleCalendarService(user.id);
        const availabilityOptions = {
            responseTimezone,
            timeDurationMinutes,
            eventSummary,
            eventDescription,
            eventLocation,
            eventAttendees,
            eventConferenceEnabled,
            eventIsPrivate,
            eventCreateBlock,
        };

        const availability = await calendarService.createAvailabilityBlock(
            timeMinRFC3339,
            timeMaxRFC3339,
            availabilityOptions,
        );
        console.log('availability', availability);

        return availability;
    },
});
