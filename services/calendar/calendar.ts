import { BaseCalendarService } from './base';
import { CalendarRefreshResult, CalendarSyncResult } from '@/types/calendar';

export class GoogleCalendarService extends BaseCalendarService {
    /*
     * Sync stored calendars for a user
     */
    async syncCalendars(): Promise<CalendarSyncResult> {
        return {
            accountSynced: 0,
            errors: [],
        };
    }

    /*
     * Refresh calendars for a user
     */
    async refreshCalendars(): Promise<CalendarRefreshResult> {
        return {
            accountsSynced: 0,
            calendarsSynced: 0,
            errors: [],
        };
    }
}
