import { Context, Hono } from 'hono';
import { requireAuth } from '../../middleware/auth';
import { EmailDataSchema } from '@/schema/exchange';
import { handleFirstPartyFlow, handleThirdPartyFlow } from '@/mastra';
import { ExchangeDataService } from '@/services/exchange/data';

const mockingbird = new Hono();

/**
 * Extract the authenticated user from the request context
 * @param requestContext - The Hono context object containing request data
 * @returns The authenticated user object
 * @throws Error if user is not found in context
 */
export const getUser = (requestContext: Context) => {
    const authenticatedUser = requestContext.get('user');
    if (!authenticatedUser) {
        throw new Error('User not found in context');
    }
    return authenticatedUser;
};

/**
 * Apply the requireAuth middleware to all routes
 */
mockingbird.use('*', requireAuth);

/**
 * POST /api/mockingbird
 */
mockingbird.post('/', async (c) => {
    // Enable the endpoint only in development environment
    if (process.env.NODE_ENV !== 'development') {
        return c.json({ error: 'Endpoint is only available in development environment' }, 403);
    }

    try {
        const user = getUser(c);
        // Get emailData from the request body
        const { emailData: rawEmailData } = await c.req.json();

        // Get type of user from header
        let userType = c.req.header('x-user-type');
        if (!userType || (userType !== 'firstParty' && userType !== 'thirdParty')) {
            console.log('defaulting to firstParty');
            userType = 'firstParty';
        } else {
            console.log('userType', userType);
        }

        // Transform timestamp to Unix timestamp in milliseconds if needed before parsing
        const transformedEmailData = {
            ...rawEmailData,
            timestamp: (() => {
                const timestamp = rawEmailData.timestamp;

                // If it's already a number, validate it's a positive integer
                if (typeof timestamp === 'number') {
                    if (!Number.isInteger(timestamp) || timestamp <= 0) {
                        throw new Error(
                            'Timestamp must be a positive integer (Unix timestamp in milliseconds)',
                        );
                    }
                    return timestamp;
                }

                // If it's a Date object, convert to Unix timestamp
                if (timestamp instanceof Date) {
                    return timestamp.getTime();
                }

                // If it's a string, try to parse it
                if (typeof timestamp === 'string') {
                    const parsed = new Date(timestamp).getTime();
                    if (isNaN(parsed)) {
                        throw new Error('Invalid timestamp string format');
                    }
                    return parsed;
                }

                // If none of the above, throw error
                throw new Error('Timestamp must be a number, Date object, or valid date string');
            })(),
        };

        // Parse emailData as EmailData type
        const emailData = EmailDataSchema.parse(transformedEmailData);

        // Save the email to the database
        const exchangeDataService = ExchangeDataService.getInstance();
        const exchangeData = await exchangeDataService.saveEmail(emailData, user.id);

        let result: {
            content: string;
            success: boolean;
        };

        // Get the scheduling agent
        if (userType === 'firstParty') {
            const signature = await exchangeDataService.getSignature(emailData.exchangeId);

            result = await handleFirstPartyFlow(user, signature, emailData, exchangeData);
        } else {
            const signature = await exchangeDataService.getSignature(emailData.exchangeId);

            result = await handleThirdPartyFlow(emailData, signature, exchangeData);
        }

        return c.json({
            result,
        });
    } catch (error) {
        console.error('error in mockingbird route:', error);
        return c.json({ error: 'Failed to process request' }, 500);
    }
});

export default mockingbird;
