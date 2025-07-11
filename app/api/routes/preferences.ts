import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetPreferences,
    handleCreatePreferences,
    handleUpdatePreferences,
    handleDeletePreferences,
} from '@/app/api/handlers/preferences';

const preferences = new Hono();

/**
 * Apply auth middleware to all preferences routes
 */
preferences.use('*', requireAuth);

/**
 * GET /api/preferences - Fetch user preferences
 */
preferences.get('/', handleGetPreferences);

/**
 * POST /api/preferences - Create user preferences
 */
preferences.post('/', handleCreatePreferences);

/**
 * PATCH /api/preferences - Update user preferences
 */
preferences.patch('/', handleUpdatePreferences);

/**
 * DELETE /api/preferences - Delete user preferences
 */
preferences.delete('/', handleDeletePreferences);

export default preferences;
