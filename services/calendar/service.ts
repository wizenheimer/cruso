import { auth } from '@/lib/auth';
import { BaseCalendarService } from './base';
import type {
    CalendarEvent,
    CalendarInfo,
    TimeRange,
    ListEventsOptions,
    GetEventOptions,
    FindEventsByICalUIDOptions,
    GetUpdatedEventsOptions,
    CreateEventOptions,
    UpdateEventOptions,
    DeleteEventOptions,
    DeleteResponse,
    RescheduleEventOptions,
    QuickCreateEventOptions,
    BatchOperationsOptions,
    ListEventsFromPrimaryCalendarResult,
} from '@/types/services';
import { CalendarConnectionsService } from './connections';
import { CalendarEventsService } from './events';
import { CalendarAvailabilityService } from './availability';
import {
    AvailabilityResult,
    BlockAvailabilityResult,
    SuggestedTimeSlot,
    WorkingHours,
    CheckAvailabilityBlockOptions,
    CreateAvailabilityBlockOptions,
    FindBestTimeForMeetingOptions,
    BatchOperation,
} from '@/types/services';
import { CalendarSearchService } from './search';
import { SearchOptions, SearchResult, QuickSearchPresets } from '@/types/services';

// ==================================================
// Main Calendar Service Class
// ==================================================

export class GoogleCalendarService extends BaseCalendarService {
    private connectionsService: CalendarConnectionsService;
    private eventsService: CalendarEventsService;
    private availabilityService: CalendarAvailabilityService;
    private searchService: CalendarSearchService;

    constructor(userId: string) {
        super(userId);

        // Initialize all sub-services
        this.connectionsService = new CalendarConnectionsService(userId);
        this.eventsService = new CalendarEventsService(userId);
        this.availabilityService = new CalendarAvailabilityService(userId);
        this.searchService = new CalendarSearchService(userId);
    }

    // ==================================================
    // Calendar Connections Methods
    // ==================================================

    async listCalendars(): Promise<CalendarInfo[]> {
        return this.connectionsService.listCalendars();
    }

    async syncAllCalendars(): Promise<{ success: number; errors: string[] }> {
        return this.connectionsService.syncAllCalendars();
    }

    async fetchAllCalendarLists(): Promise<{
        accountsSynced: number;
        calendarsSynced: number;
        errors: string[];
    }> {
        return this.connectionsService.fetchAllCalendarLists();
    }

    // ==================================================
    // Events Methods
    // ==================================================

    async listEventsFromPrimaryCalendar(
        options?: ListEventsOptions,
    ): Promise<ListEventsFromPrimaryCalendarResult> {
        return this.eventsService.listEventsFromPrimaryCalendar(options);
    }

    async listEvents(
        calendarId: string,
        options?: ListEventsOptions,
    ): Promise<{ events: CalendarEvent[]; nextPageToken?: string; nextSyncToken?: string }> {
        return this.eventsService.listEvents(calendarId, options);
    }

    async getEvent(calendarId: string, options: GetEventOptions): Promise<CalendarEvent> {
        return this.eventsService.getEvent(calendarId, options);
    }

    async getEventFromPrimaryCalendar(options: GetEventOptions): Promise<CalendarEvent> {
        return this.eventsService.getEventFromPrimaryCalendar(options);
    }

    async findEventsByICalUID(
        iCalUID: string,
        options?: FindEventsByICalUIDOptions,
    ): Promise<Map<string, CalendarEvent[]>> {
        return this.eventsService.findEventsByICalUID(iCalUID, options);
    }

    async getUpdatedEvents(
        calendarId: string,
        updatedMin: string,
        options?: GetUpdatedEventsOptions,
    ): Promise<{
        events: CalendarEvent[];
        deletedEvents: string[];
        nextPageToken?: string;
        nextSyncToken?: string;
    }> {
        return this.eventsService.getUpdatedEvents(calendarId, updatedMin, options);
    }

    async createEventInPrimaryCalendar(
        event: CalendarEvent,
        options?: CreateEventOptions,
    ): Promise<CalendarEvent & { calendarId: string }> {
        return this.eventsService.createEventInPrimaryCalendar(event, options);
    }

    async createEvent(
        calendarId: string,
        event: CalendarEvent,
        options?: CreateEventOptions,
    ): Promise<CalendarEvent> {
        return this.eventsService.createEvent(calendarId, event, options);
    }

    async updateEventInPrimaryCalendar(
        eventId: string,
        event: Partial<CalendarEvent>,
        options?: UpdateEventOptions,
    ): Promise<CalendarEvent & { calendarId: string }> {
        return this.eventsService.updateEventInPrimaryCalendar(eventId, event, options);
    }

    async updateEvent(
        calendarId: string,
        eventId: string,
        event: Partial<CalendarEvent>,
        options?: UpdateEventOptions,
    ): Promise<CalendarEvent> {
        return this.eventsService.updateEvent(calendarId, eventId, event, options);
    }

    async deleteEventFromPrimaryCalendar(options: DeleteEventOptions): Promise<DeleteResponse> {
        return this.eventsService.deleteEventFromPrimaryCalendar(options);
    }

    async deleteEvent(calendarId: string, options: DeleteEventOptions): Promise<DeleteResponse> {
        return this.eventsService.deleteEvent(calendarId, options);
    }

    async rescheduleEventInPrimaryCalendar(
        eventId: string,
        startDateTime: string,
        endDateTime: string,
        timeZone: string,
        options?: RescheduleEventOptions,
    ): Promise<CalendarEvent & { calendarId: string }> {
        return this.eventsService.rescheduleEventInPrimaryCalendar(
            eventId,
            startDateTime,
            endDateTime,
            timeZone,
            options,
        );
    }

    async rescheduleEvent(
        calendarId: string,
        eventId: string,
        startDateTime: string,
        endDateTime: string,
        timeZone: string,
        options?: RescheduleEventOptions,
    ): Promise<CalendarEvent> {
        return this.eventsService.rescheduleEvent(
            calendarId,
            eventId,
            startDateTime,
            endDateTime,
            timeZone,
            options,
        );
    }

    async quickCreateEventInPrimaryCalendar(
        summary: string,
        startDateTime: string,
        endDateTime: string,
        options?: QuickCreateEventOptions,
    ): Promise<CalendarEvent & { calendarId: string }> {
        return this.eventsService.quickCreateEventInPrimaryCalendar(
            summary,
            startDateTime,
            endDateTime,
            options,
        );
    }

    async performBatchOperationsOnPrimaryCalendar(
        operations: Array<{
            type: 'create' | 'update' | 'delete';
            eventId?: string;
            event?: CalendarEvent | Partial<CalendarEvent>;
        }>,
        options?: BatchOperationsOptions,
    ): Promise<{
        successful: Array<{
            operation: BatchOperation;
            result?: CalendarEvent | { deleted: boolean };
        }>;
        failed: Array<{ operation: BatchOperation; error: string }>;
    }> {
        return this.eventsService.performBatchOperationsOnPrimaryCalendar(operations, options);
    }

    // ==================================================
    // Availability Methods
    // ==================================================

    async checkAvailabilityBlock(
        timeMinRFC3339: string,
        timeMaxRFC3339: string,
        options: CheckAvailabilityBlockOptions = {},
    ): Promise<AvailabilityResult> {
        return this.availabilityService.checkAvailabilityBlock(
            timeMinRFC3339,
            timeMaxRFC3339,
            options,
        );
    }

    async createAvailabilityBlock(
        timeMinRFC3339: string,
        timeMaxRFC3339: string,
        options: CreateAvailabilityBlockOptions = {},
    ): Promise<BlockAvailabilityResult> {
        return this.availabilityService.createAvailabilityBlock(
            timeMinRFC3339,
            timeMaxRFC3339,
            options,
        );
    }

    async findBestTimeForMeeting(
        durationMinutes: number,
        attendeeEmails: string[],
        options?: FindBestTimeForMeetingOptions,
    ): Promise<SuggestedTimeSlot[]> {
        return this.availabilityService.findBestTimeForMeeting(
            durationMinutes,
            attendeeEmails,
            options,
        );
    }

    // ==================================================
    // Search Methods
    // ==================================================

    async searchPrimaryCalendarEvents(options: SearchOptions = {}): Promise<SearchResult> {
        return this.searchService.searchPrimaryCalendarEvents(options);
    }

    getQuickSearchPresets(): QuickSearchPresets {
        return this.searchService.getQuickSearchPresets();
    }

    async quickSearchPrimaryCalendar(query: string): Promise<CalendarEvent[]> {
        return this.searchService.quickSearchPrimaryCalendar(query);
    }
}

// ==================================================
// Utility Functions
// ==================================================

export function createCalendarService(userId: string): GoogleCalendarService {
    return new GoogleCalendarService(userId);
}

export async function getCalendarServiceForUser(
    headers: Headers,
): Promise<GoogleCalendarService | null> {
    try {
        const session = await auth.api.getSession({ headers });
        if (!session) {
            return null;
        }
        return new GoogleCalendarService(session.user.id);
    } catch (error) {
        console.error('Error getting calendar service for user:', error);
        return null;
    }
}

// ==================================================
// Export all interfaces and types for backward compatibility
// ==================================================

export type {
    CalendarEvent,
    CalendarInfo,
    TimeRange,
    AvailabilityResult,
    BlockAvailabilityResult,
    SuggestedTimeSlot,
    WorkingHours,
    SearchOptions,
    SearchResult,
    QuickSearchPresets,
};
