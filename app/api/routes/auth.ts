import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import z from 'zod';
import { authCallbackHandler, authURLHandler, authExchangeHandler } from '../handlers/auth';

const auth = new Hono();

// Get Google Auth URL - used to authenticate with Google
auth.get('/google/url', authURLHandler);

// OAuth callback handler - handles the redirect from Google
auth.get('/google/callback', authCallbackHandler);

// Exchange authorization code for tokens - used to exchange the authorization code for tokens
auth.post(
    '/google/exchange',
    zValidator(
        'json',
        z.object({
            code: z.string(),
            userEmail: z.string().email(),
        }),
    ),
    authExchangeHandler,
);

export default auth;
