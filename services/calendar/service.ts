import { auth } from '@/lib/auth';
import { BaseCalendarService, CalendarEvent, CalendarInfo, TimeRange } from './base';
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
} from '@/types/services';
import { CalendarRecurringEventsService } from './recurring-events';
import { CalendarSearchService } from './search';
import {
    SearchOptions,
    SearchResult,
    QuickSearchPresets,
    RecurringEvent,
    BatchCreateRecurringEventsResult,
} from '@/types/services';
import { RecurrenceRule } from '@/lib/recurrence';

// ==================================================
// Main Calendar Service Class
// ==================================================

export class GoogleCalendarService extends BaseCalendarService {
    private connectionsService: CalendarConnectionsService;
    private eventsService: CalendarEventsService;
    private availabilityService: CalendarAvailabilityService;
    private recurringEventsService: CalendarRecurringEventsService;
    private searchService: CalendarSearchService;

    constructor(userId: string) {
        super(userId);

        // Initialize all sub-services
        this.connectionsService = new CalendarConnectionsService(userId);
        this.eventsService = new CalendarEventsService(userId);
        this.availabilityService = new CalendarAvailabilityService(userId);
        this.recurringEventsService = new CalendarRecurringEventsService(userId);
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

    async getEventsFromPrimaryCalendar(
        timeMin: string,
        timeMax: string,
        options?: {
            maxResults?: number;
            pageToken?: string;
            q?: string;
            showDeleted?: boolean;
            singleEvents?: boolean;
            orderBy?: 'startTime' | 'updated';
            timeZone?: string;
            alwaysIncludeEmail?: boolean;
            iCalUID?: string;
        },
    ): Promise<{ events: CalendarEvent[]; nextPageToken?: string; calendarId: string }> {
        return this.eventsService.getEventsFromPrimaryCalendar(timeMin, timeMax, options);
    }

    async getEvents(
        calendarId: string,
        timeMin: string,
        timeMax: string,
        options?: {
            maxResults?: number;
            pageToken?: string;
            q?: string;
            showDeleted?: boolean;
            singleEvents?: boolean;
            orderBy?: 'startTime' | 'updated';
            timeZone?: string;
            alwaysIncludeEmail?: boolean;
            iCalUID?: string;
        },
    ): Promise<{ events: CalendarEvent[]; nextPageToken?: string; nextSyncToken?: string }> {
        return this.eventsService.getEvents(calendarId, timeMin, timeMax, options);
    }

    async getEvent(
        calendarId: string,
        eventId: string,
        options?: {
            timeZone?: string;
            alwaysIncludeEmail?: boolean;
            maxAttendees?: number;
        },
    ): Promise<CalendarEvent> {
        return this.eventsService.getEvent(calendarId, eventId, options);
    }

    async getEventFromPrimaryCalendar(
        eventId: string,
        options?: {
            timeZone?: string;
            alwaysIncludeEmail?: boolean;
            maxAttendees?: number;
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        return this.eventsService.getEventFromPrimaryCalendar(eventId, options);
    }

    async findEventsByICalUID(
        iCalUID: string,
        options?: {
            timeZone?: string;
            includeDeleted?: boolean;
        },
    ): Promise<Map<string, CalendarEvent[]>> {
        return this.eventsService.findEventsByICalUID(iCalUID, options);
    }

    async getUpdatedEvents(
        calendarId: string,
        updatedMin: string,
        options?: {
            maxResults?: number;
            pageToken?: string;
            syncToken?: string;
            timeZone?: string;
        },
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
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
            conferenceDataVersion?: number;
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        return this.eventsService.createEventInPrimaryCalendar(event, options);
    }

    async createEvent(
        calendarId: string,
        event: CalendarEvent,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
            conferenceDataVersion?: number;
        },
    ): Promise<CalendarEvent> {
        return this.eventsService.createEvent(calendarId, event, options);
    }

    async updateEventInPrimaryCalendar(
        eventId: string,
        event: Partial<CalendarEvent>,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        return this.eventsService.updateEventInPrimaryCalendar(eventId, event, options);
    }

    async updateEvent(
        calendarId: string,
        eventId: string,
        event: Partial<CalendarEvent>,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent> {
        return this.eventsService.updateEvent(calendarId, eventId, event, options);
    }

    async deleteEventFromPrimaryCalendar(
        eventId: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<{ calendarId: string }> {
        return this.eventsService.deleteEventFromPrimaryCalendar(eventId, options);
    }

    async deleteEvent(
        calendarId: string,
        eventId: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<void> {
        return this.eventsService.deleteEvent(calendarId, eventId, options);
    }

    async rescheduleEventInPrimaryCalendar(
        eventId: string,
        startDateTime: string,
        endDateTime: string,
        timeZone: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
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
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
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
        options?: {
            description?: string;
            location?: string;
            attendees?: string[];
            sendUpdates?: 'all' | 'externalOnly' | 'none';
            conferenceDataVersion?: number;
            createConference?: boolean;
            colorId?: string;
            reminders?: {
                useDefault?: boolean;
                overrides?: Array<{
                    method: 'email' | 'popup';
                    minutes: number;
                }>;
            };
        },
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
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<{
        successful: Array<{ operation: any; result?: any }>;
        failed: Array<{ operation: any; error: string }>;
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
    // Recurring Events Methods
    // ==================================================

    async getRecurringEventInstances(
        calendarId: string,
        recurringEventId: string,
        timeMin: string,
        timeMax: string,
        options?: {
            maxResults?: number;
            pageToken?: string;
            timeZone?: string;
            showDeleted?: boolean;
        },
    ): Promise<{ instances: CalendarEvent[]; nextPageToken?: string }> {
        return this.recurringEventsService.getRecurringEventInstances(
            calendarId,
            recurringEventId,
            timeMin,
            timeMax,
            options,
        );
    }

    async createRecurringEventInPrimaryCalendar(
        event: CalendarEvent & {
            recurrence?: RecurrenceRule[];
        },
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
            conferenceDataVersion?: number;
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        return this.recurringEventsService.createRecurringEventInPrimaryCalendar(event, options);
    }

    async createRecurringEvent(
        calendarId: string,
        event: CalendarEvent & {
            recurrence?: RecurrenceRule[];
        },
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
            conferenceDataVersion?: number;
        },
    ): Promise<CalendarEvent> {
        return this.recurringEventsService.createRecurringEvent(calendarId, event, options);
    }

    async batchCreateRecurringEventsInPrimaryCalendar(
        events: Array<CalendarEvent & { recurrence?: RecurrenceRule[] }>,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
            conferenceDataVersion?: number;
        },
    ): Promise<BatchCreateRecurringEventsResult> {
        return this.recurringEventsService.batchCreateRecurringEventsInPrimaryCalendar(
            events,
            options,
        );
    }

    async updateRecurringEventInPrimaryCalendar(
        eventId: string,
        event: Partial<CalendarEvent> & {
            recurrence?: RecurrenceRule[];
        },
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        return this.recurringEventsService.updateRecurringEventInPrimaryCalendar(
            eventId,
            event,
            options,
        );
    }

    async updateRecurringEvent(
        calendarId: string,
        eventId: string,
        event: Partial<CalendarEvent> & {
            recurrence?: RecurrenceRule[];
        },
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent> {
        return this.recurringEventsService.updateRecurringEvent(
            calendarId,
            eventId,
            event,
            options,
        );
    }

    async updateRecurringEventInstance(
        calendarId: string,
        eventId: string,
        instanceStartTime: string,
        updates: Partial<CalendarEvent>,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent> {
        return this.recurringEventsService.updateRecurringEventInstance(
            calendarId,
            eventId,
            instanceStartTime,
            updates,
            options,
        );
    }

    async updateFutureRecurringEvents(
        calendarId: string,
        eventId: string,
        fromDateTime: string,
        updates: Partial<CalendarEvent> & { recurrence?: RecurrenceRule[] },
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent> {
        return this.recurringEventsService.updateFutureRecurringEvents(
            calendarId,
            eventId,
            fromDateTime,
            updates,
            options,
        );
    }

    async deleteRecurringEventFromPrimaryCalendar(
        eventId: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<{ calendarId: string }> {
        return this.recurringEventsService.deleteRecurringEventFromPrimaryCalendar(
            eventId,
            options,
        );
    }

    async deleteRecurringEvent(
        calendarId: string,
        eventId: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<void> {
        return this.recurringEventsService.deleteRecurringEvent(calendarId, eventId, options);
    }

    async deleteRecurringEventInstance(
        calendarId: string,
        eventId: string,
        instanceStartTime: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<void> {
        return this.recurringEventsService.deleteRecurringEventInstance(
            calendarId,
            eventId,
            instanceStartTime,
            options,
        );
    }

    async updateRecurringEventInstanceInPrimaryCalendar(
        eventId: string,
        instanceStartTime: string,
        updates: Partial<CalendarEvent>,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        return this.recurringEventsService.updateRecurringEventInstanceInPrimaryCalendar(
            eventId,
            instanceStartTime,
            updates,
            options,
        );
    }

    async updateFutureRecurringEventsInPrimaryCalendar(
        eventId: string,
        fromDateTime: string,
        updates: Partial<CalendarEvent> & { recurrence?: RecurrenceRule[] },
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        return this.recurringEventsService.updateFutureRecurringEventsInPrimaryCalendar(
            eventId,
            fromDateTime,
            updates,
            options,
        );
    }

    async deleteRecurringEventInstanceInPrimaryCalendar(
        eventId: string,
        instanceStartTime: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<{ calendarId: string }> {
        return this.recurringEventsService.deleteRecurringEventInstanceInPrimaryCalendar(
            eventId,
            instanceStartTime,
            options,
        );
    }

    async getRecurringEventInstancesInPrimaryCalendar(
        eventId: string,
        timeMin: string,
        timeMax: string,
        options?: {
            maxResults?: number;
            pageToken?: string;
            timeZone?: string;
            showDeleted?: boolean;
        },
    ): Promise<{ instances: CalendarEvent[]; nextPageToken?: string; calendarId: string }> {
        return this.recurringEventsService.getRecurringEventInstancesInPrimaryCalendar(
            eventId,
            timeMin,
            timeMax,
            options,
        );
    }

    async getRecurringEventFromPrimaryCalendar(
        eventId: string,
        options?: {
            timeZone?: string;
            alwaysIncludeEmail?: boolean;
            maxAttendees?: number;
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        return this.recurringEventsService.getRecurringEventFromPrimaryCalendar(eventId, options);
    }

    async getRecurringEvent(
        calendarId: string,
        eventId: string,
        options?: {
            timeZone?: string;
            alwaysIncludeEmail?: boolean;
            maxAttendees?: number;
        },
    ): Promise<CalendarEvent> {
        return this.recurringEventsService.getRecurringEvent(calendarId, eventId, options);
    }

    async rescheduleRecurringEventInPrimaryCalendar(
        eventId: string,
        startDateTime: string,
        endDateTime: string,
        timeZone: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent & { calendarId: string }> {
        return this.recurringEventsService.rescheduleRecurringEventInPrimaryCalendar(
            eventId,
            startDateTime,
            endDateTime,
            timeZone,
            options,
        );
    }

    async rescheduleRecurringEvent(
        calendarId: string,
        eventId: string,
        startDateTime: string,
        endDateTime: string,
        timeZone: string,
        options?: {
            sendUpdates?: 'all' | 'externalOnly' | 'none';
        },
    ): Promise<CalendarEvent> {
        return this.recurringEventsService.rescheduleRecurringEvent(
            calendarId,
            eventId,
            startDateTime,
            endDateTime,
            timeZone,
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
    RecurrenceRule,
    SearchOptions,
    SearchResult,
    QuickSearchPresets,
};
