import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { z } from 'zod';
import { createCalendarService } from '@/services/calendar/service';
import {
    createEventInPrimaryCalendarToolSchema,
    viewCalendarEventsFromPrimaryCalendarToolSchema,
    searchCalendarEventsFromPrimaryCalendarToolSchema,
    modifyEventInPrimaryCalendarToolSchema,
    cancelEventInPrimaryCalendarToolSchema,
    initiateReschedulingOverEmailInPrimaryCalendarToolSchema,
    initiateSchedulingOverEmailInPrimaryCalendarToolSchema,
    findBookableSlotsIncludeCalendarsSchema,
    checkBusyStatusToolSchema,
} from '@/schema/tools/event';

// Helper function to log tool execution
const logToolExecution = (toolName: string, input: any, output: any) => {
    console.log('='.repeat(50));
    console.log(`[${toolName}] Input:`, JSON.stringify(input, null, 2));
    console.log(`[${toolName}] Output:`, output);
    console.log('='.repeat(50));
};

/**
 * Create a new event
 * @param context - The context of the event
 * @param runtimeContext - The runtime context
 * @returns The result of the event creation
 */
export const createEvent = createTool({
    id: 'create-event',
    description: 'Create new calendar events after slot confirmation or direct request',
    inputSchema: createEventInPrimaryCalendarToolSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        const result = await calendarService.createEvent({
            ...options,
        });

        logToolExecution('create-event', context, result);
        return result;
    },
});

/**
 * List events
 * @param context - The context of the event
 * @param runtimeContext - The runtime context
 * @returns The result of the event listing
 */
export const viewCalendarEvents = createTool({
    id: 'view-calendar-events',
    description: 'Lists and displays events within specific date/time ranges',
    inputSchema: viewCalendarEventsFromPrimaryCalendarToolSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        const result = await calendarService.listEvents(options);

        logToolExecution('list-events', context, result);
        return result;
    },
});

/**
 * Update an event
 * @param context - The context of the event
 * @param runtimeContext - The runtime context
 * @returns The result of the event update
 */
export const modifyEvent = createTool({
    id: 'modify-event',
    description: 'Update details, times, attendees or more for existing events',
    inputSchema: modifyEventInPrimaryCalendarToolSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        const result = await calendarService.updateEvent(options);

        logToolExecution('update-event', context, result);
        return result;
    },
});

/**
 * Delete an event
 * @param context - The context of the event
 * @param runtimeContext - The runtime context
 * @returns The result of the event deletion
 */
export const cancelEvent = createTool({
    id: 'cancel-event',
    description: 'Remove or cancel scheduled events from calendar',
    inputSchema: cancelEventInPrimaryCalendarToolSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        const result = await calendarService.deleteEvent(options);

        logToolExecution('delete-event', context, result);
        return result;
    },
});

/**
 * Get availability
 * @param context - The context of the availability
 * @param runtimeContext - The runtime context
 * @returns The result of the availability check
 */
export const checkBusyStatus = createTool({
    id: 'check-busy-status',
    description:
        'Check when the executive is busy/free during a specific time period without suggesting bookable slots',
    inputSchema: checkBusyStatusToolSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        const result = await calendarService.checkAvailability(options);

        logToolExecution('get-availability', context, result);
        return result;
    },
});

/**
 * Search events
 * @param context - The context of the event search
 * @param runtimeContext - The runtime context
 * @returns The result of the event search
 */
export const searchCalendarEvents = createTool({
    id: 'search-events',
    description: 'Search events',
    inputSchema: searchCalendarEventsFromPrimaryCalendarToolSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        const result = await calendarService.searchEvents(options);

        logToolExecution('search-events', context, result);
        return result;
    },
});

/**
 * Find bookable slots
 * @param context - The context of the bookable slots
 * @param runtimeContext - The runtime context
 * @returns The result of the bookable slots
 */
export const findBookableSlots = createTool({
    id: 'find-bookable-slots',
    description:
        'Find specific bookable time slots of requested duration within a time range, formatted for immediate scheduling',
    inputSchema: findBookableSlotsIncludeCalendarsSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        const result = await calendarService.suggestSlots(options);

        logToolExecution('find-availability-slots', context, result);
        return result;
    },
});

/**
 * Request rescheduling
 * @param context - The context of the rescheduling request
 * @param runtimeContext - The runtime context
 * @returns The result of the rescheduling request
 */
export const initiateReschedulingOverEmailWithHostAndAttendees = createTool({
    id: 'initiate-rescheduling-over-email-with-host-and-attendees',
    description:
        'Start email threads to coordinate rescheduling existing multiparty events over email with host and attendees',
    inputSchema: initiateReschedulingOverEmailInPrimaryCalendarToolSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        const result = await calendarService.requestReschedulingForEvent(options);

        logToolExecution('request-rescheduling-for-event', context, result);
        return result;
    },
});

/**
 * Request scheduling
 * @param context - The context of the scheduling request
 * @param runtimeContext - The runtime context
 * @returns The result of the scheduling request
 */
export const initiateSchedulingOverEmailWithHostAndAttendees = createTool({
    id: 'initiate-scheduling-over-email-with-host-and-attendees',
    description:
        'Start email threads to coordinate scheduling new multiparty events over email with host and attendees',
    inputSchema: initiateSchedulingOverEmailInPrimaryCalendarToolSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        const result = await calendarService.requestSchedulingForEvent(options);

        logToolExecution('request-scheduling-for-event', context, result);
        return result;
    },
});
