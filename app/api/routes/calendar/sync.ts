import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import { handleSyncAllCalendars, handleSyncCalendar } from '@/app/api/handlers/calendar';

const sync = new Hono();

/**
 * Apply auth middleware to all sync routes
 */
sync.use('*', requireAuth);

/**
 * POST /api/v1/calendar/sync-all
 */
sync.post('/all', handleSyncAllCalendars);

/**
 * POST /api/v1/calendar/:id/sync
 */
sync.post('/:id', handleSyncCalendar);

export default sync;
