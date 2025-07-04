import { Context, Next } from 'hono';

// Types for authenticated user
export interface AuthenticatedUser {
    id: string;
    email: string;
    role: 'user' | 'admin';
}

// Extend Hono's context to include user
declare module 'hono' {
    interface ContextVariableMap {
        user: AuthenticatedUser;
    }
}

// Authentication middleware
export const auth = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json(
            {
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header',
                timestamp: new Date().toISOString(),
            },
            401,
        );
    }

    const token = authHeader.substring(7);

    try {
        // In a real app, you would verify the JWT token here
        // For demo purposes, we'll simulate a valid token
        if (token === 'demo-token') {
            const user: AuthenticatedUser = {
                id: '1',
                email: 'user@example.com',
                role: 'user',
            };

            c.set('user', user);
            await next();
        } else {
            return c.json(
                {
                    error: 'Unauthorized',
                    message: 'Invalid token',
                    timestamp: new Date().toISOString(),
                },
                401,
            );
        }
    } catch {
        return c.json(
            {
                error: 'Unauthorized',
                message: 'Token verification failed',
                timestamp: new Date().toISOString(),
            },
            401,
        );
    }
};

// Admin-only middleware
export const requireAdmin = async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user || user.role !== 'admin') {
        return c.json(
            {
                error: 'Forbidden',
                message: 'Admin access required',
                timestamp: new Date().toISOString(),
            },
            403,
        );
    }

    await next();
};

// Optional authentication middleware
export const optionalAuth = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);

        try {
            if (token === 'demo-token') {
                const user: AuthenticatedUser = {
                    id: '1',
                    email: 'user@example.com',
                    role: 'user',
                };

                c.set('user', user);
            }
        } catch {
            // Silently fail for optional auth
        }
    }

    await next();
};
