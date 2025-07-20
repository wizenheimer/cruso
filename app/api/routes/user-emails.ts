import { Hono } from 'hono';
import { requireAuth } from '@/app/api/middleware/auth';
import {
    handleGetUserEmails,
    handleAddUserEmail,
    handleUpdateUserEmail,
    handleDeleteUserEmail,
} from '@/app/api/handlers/user-email/user-emails';

const userEmails = new Hono();

/**
 * Apply auth middleware to all user email routes
 */
userEmails.use('*', requireAuth);

/**
 * GET /api/user-emails - Fetch user emails
 */
userEmails.get('/', handleGetUserEmails);

/**
 * POST /api/user-emails - Add new user email
 */
userEmails.post('/', handleAddUserEmail);

/**
 * PATCH /api/user-emails/:id - Update user email
 */
userEmails.patch('/:id', handleUpdateUserEmail);

/**
 * DELETE /api/user-emails/:id - Delete user email
 */
userEmails.delete('/:id', handleDeleteUserEmail);

export default userEmails;
