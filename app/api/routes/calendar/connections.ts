import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetCalendarConnections,
    handleGetCalendarAccounts,
    handleUpdateCalendarConnection,
    handleDeleteCalendarAccount,
} from '@/app/api/handlers/calendar';

const connections = new Hono();

/**
 * Apply auth middleware to all connection routes
 */
connections.use('*', requireAuth);

/**
 * GET /api/v1/calendar - Fetch user's calendar connections
 */
connections.get('/', handleGetCalendarConnections);

/**
 * GET /api/v1/calendar/accounts
 */
connections.get('/accounts', handleGetCalendarAccounts);

/**
 * PATCH /api/v1/calendar/:id
 */
connections.patch('/:id', handleUpdateCalendarConnection);

/**
 * DELETE /api/v1/calendar
 */
connections.delete('/', handleDeleteCalendarAccount);

export default connections;
