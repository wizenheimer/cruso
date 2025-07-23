import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetWorkingHours,
    handleCreateWorkingHours,
    handleUpdateWorkingHours,
    handleDeleteWorkingHours,
    handleCheckUserAvailability,
} from '@/app/api/handlers/working-hours';

const workingHours = new Hono();

/**
 * Apply auth middleware to all working hours routes
 */
workingHours.use('*', requireAuth);

/**
 * GET /api/working-hours - Fetch user working hours
 */
workingHours.get('/', handleGetWorkingHours);

/**
 * POST /api/working-hours - Create new working hours
 */
workingHours.post('/', handleCreateWorkingHours);

/**
 * PATCH /api/working-hours/:id - Update working hours
 */
workingHours.patch('/:id', handleUpdateWorkingHours);

/**
 * DELETE /api/working-hours/:id - Delete working hours
 */
workingHours.delete('/:id', handleDeleteWorkingHours);

/**
 * GET /api/working-hours/check - Check if user is available at a specific time
 */
workingHours.get('/check', handleCheckUserAvailability);

export default workingHours;
