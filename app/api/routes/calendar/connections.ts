import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleListCalendarConnections,
    handleListCalendarAccounts,
    handleUpdateCalendarConnection,
    handleDeleteCalendarAccount,
} from '@/app/api/handlers/calendar';

const connections = new Hono();

/**
 * Apply auth middleware to all connection routes
 */
connections.use('*', requireAuth);

/**
 * GET /api/v1/calendar - List user's calendar connections
 */
connections.get('/', handleListCalendarConnections);

/**
 * DELETE /api/v1/calendar/:id - Delete a user's calendar account
 */
connections.delete('/:id', handleDeleteCalendarAccount);

/**
 * GET /api/v1/calendar/accounts - List user's calendar accounts
 */
connections.get('/accounts', handleListCalendarAccounts);

/**
 * PATCH /api/v1/calendar/:id - Update a user's calendar connection
 */
connections.patch('/:id', handleUpdateCalendarConnection);

export default connections;
