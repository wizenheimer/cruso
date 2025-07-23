import { auth } from '@/lib/auth';
import { BaseCalendarService } from './base';
import { EventsService } from './events';
import { AvailabilityService } from './availability';
import { GoogleCalendarService } from './calendar';
import { CalendarRefreshResult } from '@/types/calendar';

// ==================================================
// Main Calendar Service Class
// ==================================================

export class CalendarService extends BaseCalendarService {
    private eventsService: EventsService;
    private availabilityService: AvailabilityService;
    private googleCalendarService: GoogleCalendarService;

    constructor(userId: string) {
        super(userId);

        // Initialize all sub-services
        this.eventsService = new EventsService(userId);
        this.availabilityService = new AvailabilityService(userId);
        this.googleCalendarService = new GoogleCalendarService(userId);
    }

    // ==================================================
    // Calendar Connections Methods
    // ==================================================

    // async syncCalendars(): Promise<CalendarSyncResult> {
    //     return this.googleCalendarService.syncCalendars();
    // }

    async refreshCalendars(): Promise<CalendarRefreshResult> {
        return this.googleCalendarService.refreshCalendars();
    }

    // ==================================================
    // Events Methods
    // ==================================================

    async listEvents() {}

    async getEvent() {}

    async createEvent() {}

    async updateEvent() {}

    async deleteEvent() {}

    // ==================================================
    // Availability Methods
    // ==================================================

    async checkAvailability() {}
}

// ==================================================
// Utility Functions
// ==================================================

export function createCalendarService(userId: string): CalendarService {
    return new CalendarService(userId);
}

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
