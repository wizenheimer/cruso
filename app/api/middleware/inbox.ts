import { Context, Next } from 'hono';
import { ExchangeService } from '@/services/exchange';
import { getUserByEmail } from '@/db/queries/users';
import { isDisallowedAddress, isDisallowedDomain } from '@/lib/email';

/**
 * The status code to return when the webhook is disallowed
 */
const disallowedWebhookStatusCode = 426;

/**
 * The flag to return when the webhook is disallowed
 */
const rejectDisallowedDomainFlag = false; // process.env.NODE_ENV === 'production';

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
        c.set('emailData', emailData);

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
 * Reject emails from disallowed domains - this is the second middleware to run
 * @param c - The context object
 * @param next - The next middleware function
 */
export const rejectDisallowedDomainsMiddleware = async (c: Context, next: Next) => {
    // If the reject disallowed domain flag is false, continue to the next middleware
    if (!rejectDisallowedDomainFlag) {
        console.log('reject disallowed domain flag is false, continuing to next middleware');
        await next();
        return;
    }

    // Get the email data from the context
    const emailData = c.get('emailData');

    if (!emailData) {
        return c.json(
            {
                status: 'error',
                message: 'No email data found',
            },
            disallowedWebhookStatusCode,
        );
    }

    // Check if the sender is from a disallowed domain
    const isDisallowedDomainFlag = isDisallowedDomain(emailData.sender);

    // Check if the sender is from a disallowed address
    const isDisallowedAddressFlag = isDisallowedAddress(emailData.sender);

    // If the sender is from a disallowed domain, return a disallowed status code
    if (isDisallowedDomainFlag || isDisallowedAddressFlag) {
        return c.json(
            {
                status: 'error',
                message: 'disallowed domain or address',
            },
            disallowedWebhookStatusCode,
        );
    }

    // If the sender is not from a disallowed domain, continue to the next middleware
    await next();
};

/**
 * Parse user from email - this is the third middleware to run
 * @param c - The context object
 * @param next - The next middleware function
 */
export const parseUserFromEmailMiddleware = async (c: Context, next: Next) => {
    console.log('parsing user from email');
    // Get the email data from the context
    const emailData = c.get('emailData');

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
    c.set('user', user);

    // Continue to the next middleware
    await next();
};
