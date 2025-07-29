import { Context, Next } from 'hono';
import { ExchangeService } from '@/services/exchange';
import { getUserByEmail } from '@/db/queries/users';
import {
    EMAIL_DATA_MIDDLEWARE_CONTEXT_KEY,
    USER_MIDDLEWARE_CONTEXT_KEY,
} from '@/constants/middleware';

/**
 * The status code to return when the webhook is disallowed
 */
const disallowedWebhookStatusCode = 426;

/**
 * Parse email data from the webhook - this is the first middleware to run
 * @param c - The context object
 * @param next - The next middleware function
 */
export const parseEmailDataMiddleware = async (c: Context, next: Next) => {
    console.log('parsing email data');
    try {
        // Get the exchange service instance
        const exchangeService = ExchangeService.getInstance();
        const emailData = await exchangeService.processEmail(c);

        // Store email data in context for downstream handlers to use
        c.set(EMAIL_DATA_MIDDLEWARE_CONTEXT_KEY, emailData);

        await next();
    } catch (error) {
        console.error('error parsing email data', error);
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

/**
 * Parse user from email - this is the third middleware to run
 * @param c - The context object
 * @param next - The next middleware function
 */
export const parseUserFromEmailMiddleware = async (c: Context, next: Next) => {
    console.log('parsing user from email');
    // Get the email data from the context
    const emailData = c.get(EMAIL_DATA_MIDDLEWARE_CONTEXT_KEY);

    if (!emailData) {
        return c.json(
            {
                status: 'error',
                message: 'No email data found',
            },
            disallowedWebhookStatusCode,
        );
    }

    // Get the user from the email
    const user = await getUserByEmail(emailData.sender);

    console.log('setting user in context', { user });

    // Store the user in the context
    c.set(USER_MIDDLEWARE_CONTEXT_KEY, user);

    // Continue to the next middleware
    await next();
};
