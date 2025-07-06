import { Context, Next } from 'hono';
import { InboxService } from '@/services/inbox';
import { getUserByEmail } from '@/db/queries/users';
import { isDisallowedDomain } from '@/lib/email';

const disallowedWebhookStatusCode = 426;

// Parse email data from the webhook - this is the first middleware to run
export const parseEmailDataMiddleware = async (c: Context, next: Next) => {
    try {
        const inboxService = InboxService.getInstance();
        const emailData = await inboxService.parseInboundWebhook(c);
        console.log('received emailData', emailData);

        // Store email data in context for downstream handlers
        c.set('emailData', emailData);

        await next();
    } catch (error) {
        console.error('Failed to process webhook:', error);
        return c.json(
            {
                status: 'error',
                message: 'Failed to process webhook',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            disallowedWebhookStatusCode,
        );
    }
};

// Reject emails from disallowed domains - this is the second middleware to run
export const rejectDisallowedDomainsMiddleware = async (c: Context, next: Next) => {
    const emailData = c.get('emailData');
    const isDisallowed = isDisallowedDomain(emailData.sender);
    if (isDisallowed) {
        return c.json(
            {
                status: 'error',
                message: 'Disallowed domain',
            },
            disallowedWebhookStatusCode,
        );
    }
    await next();
};

// Parse user from email - this is the third middleware to run
export const parseUserFromEmailMiddleware = async (c: Context, next: Next) => {
    const emailData = c.get('emailData');
    const user = await getUserByEmail(emailData.sender);
    if (user) {
        c.set('user', user);
    }
    await next();
};
