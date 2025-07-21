import { Context, Hono } from 'hono';
import { requireAuth } from '../../middleware/auth';
import { EmailDataSchema } from '@/services/inbox/types';
import { mastra } from '@/mastra';
import { User } from '@/types/api/users';
import { RuntimeContext } from '@mastra/core/runtime-context';

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
                    : new Date(rawEmailData.timestamp),
        };

        // Parse emailData as EmailData type
        const emailData = EmailDataSchema.parse(transformedEmailData);

        // Prepare agent's runtimeContext type structure
        type SupervisorAgentRuntimeContext = {
            user: User;
        };

        // Create a new runtime context for the agent
        const runtimeContext = new RuntimeContext<SupervisorAgentRuntimeContext>();
        runtimeContext.set('user', user);

        // Get the supervisor agent
        const agent = await mastra.getAgent('supervisorAgent');

        // Call the supervisor agent
        const result = await agent.generate(emailData.body, {
            runtimeContext, // Pass the runtime context to the agent
            maxSteps: 5, // Allow up to 5 tool usage steps
            onStepFinish: ({ text, toolCalls, toolResults }) => {
                console.log('Step completed:', { text, toolCalls, toolResults });
            },
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
