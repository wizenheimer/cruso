import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetPreferences,
    handleCreatePreferences,
    handleUpdatePreferences,
    handleDeletePreferences,
    handleUpdatePrimaryEmail,
    handleUpdatePrimaryAccount,
    handleGetPrimaryOptions,
    handleGeneratePreferencesDocument,
    handleUpdatePreferencesDocument,
} from '@/app/api/handlers/preference';

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
 * POST /api/preferences/generate-document - Generate preferences document
 */
preferences.post('/generate-document', handleGeneratePreferencesDocument);

/**
 * PATCH /api/preferences/update-document - Update user preferences document
 */
preferences.patch('/update-document', handleUpdatePreferencesDocument);

/**
 * DELETE /api/preferences - Delete user preferences
 */
preferences.delete('/', handleDeletePreferences);

/**
 * GET /api/preferences/primary-options - Get available primary email and account options
 */
preferences.get('/primary-options', handleGetPrimaryOptions);

/**
 * PATCH /api/preferences/primary-email - Update primary user email
 */
preferences.patch('/primary-email', handleUpdatePrimaryEmail);

/**
 * PATCH /api/preferences/primary-account - Update primary account
 */
preferences.patch('/primary-account', handleUpdatePrimaryAccount);

export default preferences;
