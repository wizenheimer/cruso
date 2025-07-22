// ==================================================
// Main Calendar Service
// ==================================================
export { GoogleCalendarService, createCalendarService, getCalendarServiceForUser } from './service';

// ==================================================
// Base Classes and Interfaces
// ==================================================
export { BaseCalendarService } from './base';
export type { CalendarEvent, CalendarInfo, TimeRange } from '@/types/services';

// ==================================================
// Calendar Connections Service
// ==================================================
export { CalendarConnectionsService } from './connections';

// ==================================================
// Calendar Events Service
// ==================================================
export { CalendarEventsService } from './events';

// ==================================================
// Calendar Availability Service
// ==================================================
export { CalendarAvailabilityService } from './availability';
export type {
    AvailabilityResult,
    BlockAvailabilityResult,
    ClearAvailabilityResult,
    WorkingHours,
    SuggestedTimeSlot,
} from './availability';

// ==================================================
// Calendar Search Service
// ==================================================
export { CalendarSearchService } from './search';
export type { SearchOptions, SearchResult, QuickSearchPresets } from './search';

// ==================================================
// Auth Manager
// ==================================================
export { GoogleAuthManager } from './manager';

// ==================================================
// Connection Manager (legacy)
// ==================================================
export { ConnectionManager } from './connection';
