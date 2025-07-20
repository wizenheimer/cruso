import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleSearchPrimaryCalendarEvents,
    handleQuickSearchPrimaryCalendar,
    handleGetQuickSearchPresets,
    handleSearchCalendarEvents,
} from '@/app/api/handlers/calendar';

const search = new Hono();

/**
 * Apply auth middleware to all search routes
 */
search.use('*', requireAuth);

// ==================================================
// Search Routes - Primary Calendar
// Routes for searching events in the primary calendar
// ==================================================

/**
 * POST /api/v1/calendar/search
 */
search.post('/', handleSearchPrimaryCalendarEvents);

/**
 * GET /api/v1/calendar/search/quick
 */
search.get('/quick', handleQuickSearchPrimaryCalendar);

/**
 * GET /api/v1/calendar/search/presets
 */
search.get('/presets', handleGetQuickSearchPresets);

// ==================================================
// Search Routes - Specific Calendar
// Routes for searching events in a specific calendar
// ==================================================

/**
 * POST /api/v1/calendar/:calendarId/search
 */
search.post('/:calendarId', handleSearchCalendarEvents);

export default search;
