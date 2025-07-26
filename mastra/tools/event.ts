import { createTool } from '@mastra/core/tools';
import { getUserFromRuntimeContext } from '@/mastra/commons';
import { z } from 'zod';
import { createCalendarService } from '@/services/calendar/service';
import {
    createEventInPrimaryCalendarToolSchema,
    deleteEventInPrimaryCalendarToolSchema,
    freeBusyOmitCalendarsSchema,
    listEventsFromPrimaryCalendarToolSchema,
    searchEventsFromPrimaryCalendarToolSchema,
    slotSuggestionToolSchema,
    updateEventInPrimaryCalendarToolSchema,
} from '@/schema/tools/event';

/**
 * Create a new event
 * @param context - The context of the event
 * @param runtimeContext - The runtime context
 * @returns The result of the event creation
 */
export const createEventTool = createTool({
    id: 'create-event',
    description: 'Create a new event',
    inputSchema: createEventInPrimaryCalendarToolSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        return calendarService.createEvent({
            ...options,
        });
    },
});

/**
 * List events
 * @param context - The context of the event
 * @param runtimeContext - The runtime context
 * @returns The result of the event listing
 */
export const listEventsTool = createTool({
    id: 'list-events',
    description: 'List events',
    inputSchema: listEventsFromPrimaryCalendarToolSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        return calendarService.listEvents(options);
    },
});

/**
 * Update an event
 * @param context - The context of the event
 * @param runtimeContext - The runtime context
 * @returns The result of the event update
 */
export const updateEventTool = createTool({
    id: 'update-event',
    description: 'Update an event',
    inputSchema: updateEventInPrimaryCalendarToolSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        return calendarService.updateEvent(options);
    },
});

/**
 * Delete an event
 * @param context - The context of the event
 * @param runtimeContext - The runtime context
 * @returns The result of the event deletion
 */
export const deleteEventTool = createTool({
    id: 'delete-event',
    description: 'Delete an event',
    inputSchema: deleteEventInPrimaryCalendarToolSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        return calendarService.deleteEvent(options);
    },
});

/**
 * Get availability
 * @param context - The context of the availability
 * @param runtimeContext - The runtime context
 * @returns The result of the availability check
 */
export const getAvailabilityTool = createTool({
    id: 'get-availability',
    description: 'Get availability',
    inputSchema: freeBusyOmitCalendarsSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        return calendarService.checkAvailability(options);
    },
});

/**
 * Search events
 * @param context - The context of the event search
 * @param runtimeContext - The runtime context
 * @returns The result of the event search
 */
export const searchEventsTool = createTool({
    id: 'search-events',
    description: 'Search events',
    inputSchema: searchEventsFromPrimaryCalendarToolSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        return calendarService.searchEvents(options);
    },
});

export const findAvailabilitySlotsTool = createTool({
    id: 'find-availability-slots',
    description: 'Find availability slots',
    inputSchema: slotSuggestionToolSchema,
    outputSchema: z.string(),
    execute: async ({ context, runtimeContext }) => {
        const user = await getUserFromRuntimeContext(runtimeContext);
        if (!user) {
            throw new Error('user not found in runtime context');
        }

        const { ...options } = context;

        const calendarService = createCalendarService(user.id);
        return calendarService.suggestSlots(options);
    },
});
