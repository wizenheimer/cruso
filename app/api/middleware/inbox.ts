import { Context, Next } from 'hono';
import { InboxService } from '@/services/inbox';
import { getUserByEmail } from '@/db/queries/users';
import { isDisallowedDomain } from '@/lib/email';

// disallowedWebhookStatusCode is the status code to return when the webhook is disallowed
const disallowedWebhookStatusCode = 426;

// rejectDisallowedDomainFlag is the flag to return when the webhook is disallowed
const rejectDisallowedDomainFlag = process.env.NODE_ENV === 'production';

// Parse email data from the webhook - this is the first middleware to run
export const parseEmailDataMiddleware = async (c: Context, next: Next) => {
    try {
        // Get the inbox service instance
        const inboxService = InboxService.getInstance();
        const emailData = await inboxService.parseEmail(c);

        // Store email data in context for downstream handlers to use
        c.set('emailData', emailData);

        await next();
    } catch (error) {
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
    // If the reject disallowed domain flag is false, continue to the next middleware
    if (!rejectDisallowedDomainFlag) {
        console.log('reject disallowed domain flag is false, continuing to next middleware');
        await next();
        return;
    }

    // Get the email data from the context
    const emailData = c.get('emailData');

    // Check if the sender is from a disallowed domain
    const isDisallowed = isDisallowedDomain(emailData.sender);

    // If the sender is from a disallowed domain, return a disallowed status code
    if (isDisallowed) {
        return c.json(
            {
                status: 'error',
                message: 'Disallowed domain',
            },
            disallowedWebhookStatusCode,
        );
    }

    // If the sender is not from a disallowed domain, continue to the next middleware
    await next();
};

// Parse user from email - this is the third middleware to run
export const parseUserFromEmailMiddleware = async (c: Context, next: Next) => {
    // Get the email data from the context
    const emailData = c.get('emailData');

    // Get the user from the email
    const user = await getUserByEmail(emailData.sender);

    // Store the user in the context
    c.set('user', user);

    // Continue to the next middleware
    await next();
};
