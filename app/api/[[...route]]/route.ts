import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import health from '../routes/health';
import inbox from '../routes/inbox';
import auth from '../routes/auth';
import calendar from '../routes/calendar';
import preferences from '../routes/preference';
import userEmails from '../routes/user-email';
import availability from '../routes/availability';
import mockingbird from '../routes/mockingbird';

/**
 * The runtime
 */
export const runtime = 'nodejs';

/**
 * The main app
 */
const app = new Hono().basePath('/api');

/**
 * Global middleware
 */
app.use('*', logger());
app.use(
    '*',
    cors({
        origin: ['http://localhost:3000', 'https://crusolabs.com'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowHeaders: ['Content-Type', 'Authorization'],
    }),
);

/**
 * Stable Routes (no versioning)
 */
app.route('/health', health);

/**
 * Stable Routes (requires no backwards compatibility)
 */
app.route('/auth', auth);

/**
 * Stable Routes (requires no backwards compatibility)
 */
app.route('/mockingbird', mockingbird);

/**
 * API versioning
 */
const v1 = new Hono();

/**
 * Versioned Routes (requires backwards compatibility)
 */
v1.route('/inbox', inbox);
v1.route('/calendar', calendar);
v1.route('/preferences', preferences);
v1.route('/user-emails', userEmails);
v1.route('/availability', availability);

app.route('/v1', v1);

/**
 * Error handling
 */
app.onError((err, c) => {
    console.error('API Error:', err);
    return c.json(
        {
            error: 'Internal Server Error',
            timestamp: new Date().toISOString(),
            route: c.req.path,
            message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        },
        500,
    );
});

/**
 * 404 handler
 */
app.notFound((c) => {
    return c.json(
        {
            error: 'Not Found',
            timestamp: new Date().toISOString(),
            route: c.req.path,
            message: 'Route not found',
        },
        404,
    );
});

/**
 * Export the app
 */
export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
