import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import health from '../routes/health';
import users from '../routes/users';
import inbox from '../routes/inbox';
import auth from '../routes/auth';
import email from '../routes/email';

export const runtime = 'edge';

// Create the main app
const app = new Hono().basePath('/api');

// Global middleware
app.use('*', logger());
app.use(
    '*',
    cors({
        origin: ['http://localhost:3000', 'https://crusolabs.com'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowHeaders: ['Content-Type', 'Authorization'],
    }),
);

// Mount health routes
app.route('/health', health);

// API versioning
const v1 = new Hono();

// Mount route modules
v1.route('/users', users);
v1.route('/inbox', inbox);
v1.route('/auth', auth);
v1.route('/email', email);

// Mount versioned routes
app.route('/v1', v1);

// Error handling
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

// 404 handler
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

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);
