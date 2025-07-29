import { Hono } from 'hono';
import { parseEmailDataMiddleware, parseUserFromEmailMiddleware } from '@/app/api/middleware/inbox';
import { handleInboxRequest } from '@/app/api/handlers/exchange';

/**
 * The inbox router
 */
const inbox = new Hono();

/**
 * The webhook request path
 */
const webhookRequestPath = `/${process.env.MAILGUN_WEBHOOK_REQUEST_PATH || 'webhook'}`;

/**
 * Apply webhook middleware to all routes in this router
 */
inbox.use('*', parseEmailDataMiddleware, parseUserFromEmailMiddleware);

/**
 * Inbox webhook endpoint
 * @param c - The context object
 * @returns The response object
 * POST /api/v1/inbox/webhook
 */
inbox.post(webhookRequestPath, handleInboxRequest);

export default inbox;
