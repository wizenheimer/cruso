import { Hono } from 'hono';
import {
    parseEmailDataMiddleware,
    parseUserFromEmailMiddleware,
    rejectDisallowedDomainsMiddleware,
} from '../middleware/inbox';
import { handleInboxRequest } from '../handlers/inbox';

const inbox = new Hono();

// Apply webhook middleware to all routes in this router
inbox.use(
    '*',
    parseEmailDataMiddleware,
    rejectDisallowedDomainsMiddleware,
    parseUserFromEmailMiddleware,
);

// Inbox webhook endpoint
inbox.post('/inbox', handleInboxRequest);

export default inbox;
