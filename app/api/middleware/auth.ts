import { Context, Next } from 'hono';

// Authentication middleware
export const auth = async (c: Context, next: Next) => {
    console.log('Auth middleware called', { context: c, next });
    // TODO: Implement actual authentication logic
    await next();
};

// Optional authentication middleware - doesn't fail if no auth provided
export const optionalAuth = async (c: Context, next: Next) => {
    console.log('Optional auth middleware called', { context: c, next });
    // TODO: Implement optional authentication logic
    // For now, just continue without setting user
    await next();
};
