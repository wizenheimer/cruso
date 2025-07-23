import { BaseCalendarService } from '@/services/calendar/base';

export class EventsService extends BaseCalendarService {
    // ================================
    // List Events
    // ================================

    /**
     * Get events from the primary calendar
     */
    async listEventsFromPrimaryCalendar() {}

    /**
     * Get events from a specific calendar
     */
    async listEventsFromAnyCalendar() {}

    // ================================
    // Get a Single Event
    // ================================

    /**
     * Get a specific event
     */
    async getEventFromAnyCalendar() {}

    /**
     * Get a specific event from the primary calendar
     */
    async getEventFromPrimaryCalendar() {}

    // ================================
    // Create an Event
    // ================================

    /**
     * Create an event in the primary calendar
     */
    async createEventInPrimaryCalendar() {}

    /**
     * Create an event in a specific calendar
     */
    async createEventFromAnyCalendar() {}

    // ================================
    // Update an Event
    // ================================

    /**
     * Update an event in the primary calendar
     */
    async updateEventInPrimaryCalendar() {}

    /**
     * Update an event in a specific calendar
     */
    async updateEventFromAnyCalendar() {}

    // ================================
    // Delete an Event
    // ================================

    /**
     * Delete an event from the primary calendar
     */
    async deleteEventFromPrimaryCalendar() {}

    /**
     * Delete an event from a specific calendar
     */
    async deleteEventFromAnyCalendar() {}
}
