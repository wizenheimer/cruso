import { Hono } from 'hono';
import { auth as authLib } from '@/lib/auth';
import { requireAuth } from '@/app/api/middleware/auth';
import { handlePostOAuthSync } from '@/app/api/handlers/auth';

const auth = new Hono();

/**
 * POST /api/auth/post-oauth-sync
 * @param c - The context object
 * @returns The response object
 */
auth.post('/post-oauth-sync', requireAuth, handlePostOAuthSync);

/**
 * Auth routes - proxy to better-auth
 * @param c - The context object
 * @returns The response object
 */
auth.all('/*', async (c) => {
    const request = c.req.raw;
    const response = await authLib.handler(request);
    return response;
});

export default auth;
