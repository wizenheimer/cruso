import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetCalendarConnections,
    handleGetCalendarAccounts,
    handleSyncCalendar,
    handleUpdateCalendarConnection,
    handleDeleteCalendarConnection,
    handleCheckAvailability,
    handleSyncAllCalendars,
} from '@/app/api/handlers/calendar';

const calendar = new Hono();

/**
 * Apply auth middleware to all calendar routes
 */
calendar.use('*', requireAuth);

/**
 * GET /api/v1/calendar - Fetch user's calendar connections
 */
calendar.get('/', handleGetCalendarConnections);

/**
 * GET /api/v1/calendar/accounts
 */
calendar.get('/accounts', handleGetCalendarAccounts);

/**
 * POST /api/v1/calendar/availability
 */
calendar.post('/availability', handleCheckAvailability);

/**
 * POST /api/v1/calendar/sync-all
 */
calendar.post('/sync-all', handleSyncAllCalendars);

/**
 * POST /api/v1/calendar/:id/sync
 */
calendar.post('/:id/sync', handleSyncCalendar);

/**
 * PATCH /api/v1/calendar/:id
 */
calendar.patch('/:id', handleUpdateCalendarConnection);

/**
 * DELETE /api/v1/calendar/:id
 */
calendar.delete('/:id', handleDeleteCalendarConnection);

export default calendar;
