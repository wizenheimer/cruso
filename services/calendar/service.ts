import { auth } from '@/lib/auth';
import { EventsService } from './events';
import { AvailabilityService } from './availability';
import { GoogleCalendarService } from './calendar';
import { CalendarRefreshResult } from '@/types/calendar';
import { SearchService } from './search';
import {
    CreateEventInPrimaryCalendarOptions,
    ListEventsFromPrimaryCalendarOptions,
    UpdateEventInPrimaryCalendarOptions,
    DeleteEventInPrimaryCalendarOptions,
    FreeBusyOmitCalendarsOptions,
    SearchEventsFromPrimaryCalendarOptions,
    SlotSuggestionOptionsExcludeCalendars,
    RequestReschedulingInPrimaryCalendarOptions,
    SchedulingInPrimaryCalendarOptions,
} from '@/types/tools/event';
import { calendar_v3 } from 'googleapis';
import { SlotSuggestionService } from './slot';
import { RequestSchedulingService } from './rescheduling';

// ==================================================
// Calendar Service
// ==================================================

/**
 * CalendarService provides a simplified interface to the complex calendar subsystem.
 * It hides the internal complexity of multiple services and provides a clean API.
 */
export class CalendarService {
    private eventsService: EventsService;
    private availabilityService: AvailabilityService;
    private slotSuggestionService: SlotSuggestionService;
    private googleCalendarService: GoogleCalendarService;
    private requestSchedulingService: RequestSchedulingService;
    private searchService: SearchService;

    constructor(userId: string) {
        // Initialize all subsystem services
        this.eventsService = new EventsService(userId);
        this.availabilityService = new AvailabilityService(userId);
        this.slotSuggestionService = new SlotSuggestionService(userId);
        this.googleCalendarService = new GoogleCalendarService(userId);
        this.requestSchedulingService = new RequestSchedulingService(userId);
        this.searchService = new SearchService(userId);
    }

    // ==================================================
    // Private Helper Methods
    // ==================================================

    /**
     * Handle errors consistently across all service methods
     */
    private handleError(error: unknown, operation: string, args?: any): string {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const argsString = args ? `received args: ${JSON.stringify(args)}, ` : '';
        return `Error ${operation}: ${argsString}error: ${errorMessage}`;
    }

    // ==================================================
    // Calendar Management
    // ==================================================

    /**
     * Refresh all calendar connections for the user
     */
    async refreshCalendars(): Promise<CalendarRefreshResult> {
        console.log('refreshCalendars called');
        return this.googleCalendarService.refreshCalendars();
    }

    // ==================================================
    // Event Management
    // ==================================================

    /**
     * List events from the primary calendar
     */
    async listEvents(options: ListEventsFromPrimaryCalendarOptions): Promise<string> {
        try {
            console.log('listEvents called with options:', JSON.stringify(options, null, 2));
            return await this.eventsService.listEventsFromPrimaryCalendar(options);
        } catch (error) {
            console.error('Error listing events:', error);
            return this.handleError(error, 'listing events from calendar', options);
        }
    }

    /**
     * Create an event in the primary calendar
     */
    async createEvent(options: CreateEventInPrimaryCalendarOptions): Promise<string> {
        try {
            console.log('createEvent called with options:', JSON.stringify(options, null, 2));
            return await this.eventsService.createEventInPrimaryCalendar(options);
        } catch (error) {
            console.error('Error creating event:', error);
            return this.handleError(error, 'creating event in calendar', options);
        }
    }

    /**
     * Update an event in the primary calendar
     */
    async updateEvent(options: UpdateEventInPrimaryCalendarOptions): Promise<string> {
        try {
            console.log('updateEvent called with options:', JSON.stringify(options, null, 2));
            return await this.eventsService.updateEventInPrimaryCalendar(options);
        } catch (error) {
            console.error('Error updating event:', error);
            return this.handleError(error, 'updating event in calendar', options);
        }
    }

    /**
     * Delete an event from the primary calendar
     */
    async deleteEvent(options: DeleteEventInPrimaryCalendarOptions): Promise<string> {
        try {
            console.log('deleteEvent called with options:', JSON.stringify(options, null, 2));
            await this.eventsService.deleteEventFromPrimaryCalendar(options);
            return 'Event deleted successfully';
        } catch (error) {
            console.error('Error deleting event:', error);
            return this.handleError(error, 'deleting event in calendar', options);
        }
    }

    // ==================================================
    // Availability Management
    // ==================================================

    /**
     * Check availability for a time block
     */
    async checkAvailability(options: FreeBusyOmitCalendarsOptions): Promise<string> {
        try {
            console.log('checkAvailability called with options:', JSON.stringify(options, null, 2));
            return await this.availabilityService.getAvailability(options);
        } catch (error) {
            console.error('Error checking availability:', error);
            return this.handleError(error, 'checking availability in calendar', options);
        }
    }

    // ==================================================
    // Search Functionality
    // ==================================================

    /**
     * Search for events in the primary calendar
     */
    async searchEvents(options: SearchEventsFromPrimaryCalendarOptions): Promise<string> {
        try {
            console.log('searchEvents called with options:', JSON.stringify(options, null, 2));
            return await this.searchService.search(options);
        } catch (error) {
            console.error('Error searching events:', error);
            return this.handleError(error, 'searching events in calendar', options);
        }
    }

    // ==================================================
    // Slot Suggestion Management
    // ==================================================

    /**
     * Suggest availability slots
     */
    async suggestSlots(options: SlotSuggestionOptionsExcludeCalendars): Promise<string> {
        try {
            console.log('suggestSlots called with options:', JSON.stringify(options, null, 2));
            return await this.slotSuggestionService.suggestSlots(options);
        } catch (error) {
            console.error('Error suggesting slots:', error);
            return this.handleError(error, 'suggesting slots in calendar', options);
        }
    }

    // ==================================================
    // Rescheduling Management
    // ==================================================

    async requestReschedulingForEvent(
        options: RequestReschedulingInPrimaryCalendarOptions,
    ): Promise<string> {
        try {
            console.log(
                'requestReschedulingForEvent called with options:',
                JSON.stringify(options, null, 2),
            );
            return await this.requestSchedulingService.requestReschedulingForEvent(options);
        } catch (error) {
            console.error('Error requesting rescheduling for event:', error);
            return this.handleError(error, 'requesting rescheduling for event', options);
        }
    }

    // ==================================================
    // Scheduling Management
    // ==================================================

    async requestSchedulingForEvent(options: SchedulingInPrimaryCalendarOptions): Promise<string> {
        try {
            console.log(
                'requestSchedulingForEvent called with options:',
                JSON.stringify(options, null, 2),
            );
            return await this.requestSchedulingService.requestSchedulingForEvent(options);
        } catch (error) {
            console.error('Error requesting scheduling for event:', error);
            return this.handleError(error, 'requesting scheduling for event', options);
        }
    }
}

// ==================================================
// Factory Functions
// ==================================================

/**
 * Create a calendar service for a user
 */
export function createCalendarService(userId: string): CalendarService {
    return new CalendarService(userId);
}

/**
 * Get a calendar service for the authenticated user
 */
export async function getCalendarServiceForUser(headers: Headers): Promise<CalendarService | null> {
    try {
        const session = await auth.api.getSession({ headers });
        if (!session) {
            return null;
        }
        return new CalendarService(session.user.id);
    } catch (error) {
        console.error('Error getting calendar service for user:', error);
        return null;
    }
}
