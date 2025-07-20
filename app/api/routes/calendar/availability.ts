import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import { handleCheckAvailability, handleBlockAvailability } from '@/app/api/handlers/calendar';

const availability = new Hono();

/**
 * Apply auth middleware to all availability routes
 */
availability.use('*', requireAuth);

/**
 * POST /api/v1/calendar/availability
 */
availability.post('/', handleCheckAvailability);

/**
 * PATCH /api/v1/calendar/availability
 */
availability.patch('/', handleBlockAvailability);

export default availability;
