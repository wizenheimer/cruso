import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import { handleRefreshCalendars } from '@/app/api/handlers/calendar';

const sync = new Hono();

/**
 * Apply auth middleware to all sync routes
 */
sync.use('*', requireAuth);

/**
 * POST /api/v1/calendar/refresh
 */
sync.post('/all', handleRefreshCalendars);

// /**
//  * POST /api/v1/calendar/:id/sync
//  */
// sync.post('/:id', handleSyncCalendar);

export default sync;
