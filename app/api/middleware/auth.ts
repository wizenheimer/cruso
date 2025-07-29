import { auth } from '@/lib/auth';
import { Context } from 'hono';
import { Next } from 'hono';
import { User } from '@/types/users';
import { USER_MIDDLEWARE_CONTEXT_KEY } from '@/constants/middleware';

/**
 * Get the session from the request headers
 * @param c - The context object
 * @returns The session object
 */
export async function getSession(c: { req: { raw: { headers: Headers } } }) {
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });
    return session;
}

/**
 * Require authentication middleware
 * @param c - The context object
 * @param next - The next middleware function
 */
export async function requireAuth(c: Context, next: Next) {
    const session = await getSession(c);

    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    // Set user in context for handlers to access
    c.set(USER_MIDDLEWARE_CONTEXT_KEY, session.user as User);

    await next();
}
