import { Hono } from 'hono';
import { auth as authLib } from '@/lib/auth';

const auth = new Hono();

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
