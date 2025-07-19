import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetCalendarConnections,
    handleGetCalendarAccounts,
    handleSyncCalendar,
    handleUpdateCalendarConnection,
    handleDeleteCalendarAccount,
    handleCheckAvailability,
    handleSyncAllCalendars,
    handleBlockAvailability,
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

// ==================================================
// Availability Routes - Check and Block Availability
// ==================================================

/**
 * POST /api/v1/calendar/availability
 */
calendar.post('/availability', handleCheckAvailability);

/**
 * PATCH /api/v1/calendar/availability
 */
calendar.patch('/availability', handleBlockAvailability);

// ==================================================

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
 * DELETE /api/v1/calendar
 */
calendar.delete('/', handleDeleteCalendarAccount);

export default calendar;
