import { Context, Hono } from 'hono';
import { requireAuth } from '../../middleware/auth';
import { EmailDataSchema } from '@/schema/exchange';
import { mastra } from '@/mastra';
import { getSchedulingAgentRuntimeContext } from '@/mastra/agent/scheduling';
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

        // Transform timestamp string to Date if needed before parsing
        const transformedEmailData = {
            ...rawEmailData,
            timestamp:
                rawEmailData.timestamp instanceof Date
                    ? rawEmailData.timestamp
                    : new Date(
                          typeof rawEmailData.timestamp === 'number'
                              ? rawEmailData.timestamp * 1000
                              : rawEmailData.timestamp,
                      ),
        };

        // Parse emailData as EmailData type
        const emailData = EmailDataSchema.parse(transformedEmailData);

        console.log('emailData', emailData);

        // Prepare the runtime context
        const runtimeContext = await getSchedulingAgentRuntimeContext(user, emailData.timestamp);

        // Get the scheduling agent
        const agent = await mastra.getAgent('schedulingAgent');

        // Generate the response
        const result = await agent.generate(emailData.body, {
            maxSteps: 10,
            resourceId: user.id,
            threadId: emailData.exchangeId,
            runtimeContext,
        });

        return c.json({
            result,
        });
    } catch (error) {
        console.error('error in mockingbird route:', error);
        return c.json({ error: 'Failed to process request' }, 500);
    }
});

export default mockingbird;
