import { Hono } from 'hono';
import { z } from 'zod';

const health = new Hono();

const healthResponseSchema = z.object({
    status: z.enum(['ok', 'error']),
    service: z.string(),
    version: z.string(),
    timestamp: z.string().datetime(),
    environment: z.enum(['development', 'production']),
});

const readinessSchema = z.object({
    status: z.enum(['ready', 'not ready']),
    service: z.string(),
    timestamp: z.string().datetime(),
});

const livenessSchema = z.object({
    status: z.enum(['alive', 'dead']),
    service: z.string(),
    timestamp: z.string().datetime(),
});

// GET /api/health
health.get('/', (c) => {
    const healthResponse = healthResponseSchema.parse({
        status: 'ok',
        service: 'cruso-api',
        version: '0.0.1',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
    });

    return c.json(healthResponse, 200, {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
    });
});

// GET /api/health/ready - Readiness check
health.get('/ready', (c) => {
    // Add any readiness checks here (database, external services, etc.)
    const isReady = true; // Replace with actual readiness logic

    if (isReady) {
        return c.json(
            readinessSchema.parse({
                status: 'ready',
                service: 'cruso-api',
                timestamp: new Date().toISOString(),
            }),
            200,
        );
    } else {
        return c.json(
            readinessSchema.parse({
                status: 'not ready',
                service: 'cruso-api',
                timestamp: new Date().toISOString(),
            }),
            503,
        );
    }
});

// GET /api/health/live - Liveness check
health.get('/live', (c) => {
    return c.json(
        livenessSchema.parse({
            status: 'alive',
            service: 'cruso-api',
            timestamp: new Date().toISOString(),
        }),
        200,
    );
});

export default health;
