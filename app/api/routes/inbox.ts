import { Hono } from 'hono';
import {
    parseEmailDataMiddleware,
    parseUserFromEmailMiddleware,
    rejectDisallowedDomainsMiddleware,
} from '../middleware/inbox';
import { handleInboxRequest } from '../handlers/inbox';

const inbox = new Hono();

const webhookRequestPath = `/${process.env.MAILGUN_WEBHOOK_REQUEST_PATH || 'webhook'}`;

// Apply webhook middleware to all routes in this router
inbox.use(
    '*',
    parseEmailDataMiddleware,
    rejectDisallowedDomainsMiddleware,
    parseUserFromEmailMiddleware,
);

// Inbox webhook endpoint
inbox.post(webhookRequestPath, handleInboxRequest);

export default inbox;
