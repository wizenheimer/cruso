import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetAvailability,
    handleCreateAvailability,
    handleUpdateAvailability,
    handleDeleteAvailability,
    handleCheckUserAvailability,
} from '@/app/api/handlers/availability';

const availability = new Hono();

/**
 * Apply auth middleware to all availability routes
 */
availability.use('*', requireAuth);

/**
 * GET /api/availability - Fetch user availability
 */
availability.get('/', handleGetAvailability);

/**
 * POST /api/availability - Create new availability
 */
availability.post('/', handleCreateAvailability);

/**
 * PATCH /api/availability/:id - Update availability
 */
availability.patch('/:id', handleUpdateAvailability);

/**
 * DELETE /api/availability/:id - Delete availability
 */
availability.delete('/:id', handleDeleteAvailability);

/**
 * GET /api/availability/check - Check if user is available at a specific time
 */
availability.get('/check', handleCheckUserAvailability);

export default availability;
