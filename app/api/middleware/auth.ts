import { Context, Next } from 'hono';

// Authentication middleware
export const auth = async (c: Context, next: Next) => {
    console.log('Auth middleware called', { context: c, next });
};
