import { RuntimeContext } from '@mastra/core/runtime-context';
import { User } from '@/types/users';
import { PinoLogger } from '@mastra/loggers';

export const USER_CONTEXT_KEY = 'user';
export const PREFERENCE_CONTEXT_KEY = 'preference';
export const TIMESTAMP_CONTEXT_KEY = 'timestamp';

/**
 * Logger - It is used to log the data of the workflow and agent.
 */
export const logger = new PinoLogger({
    name: 'Mastra',
    level: 'info',
});

/**
 * Get the user from the runtime context
 * @param runtimeContext - The runtime context
 * @returns The user
 */
export const getUserFromRuntimeContext = (runtimeContext: RuntimeContext) => {
    const user: User = runtimeContext.get(USER_CONTEXT_KEY);
    if (!user) {
        // If it's a development environment, use the test user
        if (process.env.NODE_ENV === 'development') {
            return {
                id: process.env.TEST_USER_ID || 'test_user_id',
                name: process.env.TEST_USER_NAME || 'Test User',
                email: process.env.TEST_USER_EMAIL || 'test@test.com',
                emailVerified: true,
                image: process.env.TEST_USER_IMAGE || 'https://example.com/test-user.png',
                createdAt: process.env.TEST_USER_CREATED_AT || new Date(),
                updatedAt: process.env.TEST_USER_UPDATED_AT || new Date(),
                preferences: {
                    document:
                        process.env.TEST_USER_PREFERENCES ||
                        'Make reasonable assumptions based on context, implied preferences, and calendar access',
                },
            };
        }
        throw new Error('User is required');
    }
    return user;
};

/**
 * Get the user preference from the runtime context
 * @param runtimeContext - The runtime context
 * @returns The user preference
 */
export const getUserPreferenceFromRuntimeContext = (runtimeContext: RuntimeContext) => {
    let preference: string | undefined = runtimeContext.get(PREFERENCE_CONTEXT_KEY);
    if (!preference) {
        // If it's a development environment, use the test user preference
        if (process.env.NODE_ENV === 'development') {
            preference =
                process.env.TEST_USER_PREFERENCES ||
                'Make reasonable assumptions based on context, implied preferences, and calendar access';
        }
        // Else use the default preference
        preference =
            'Make reasonable assumptions based on context, implied preferences, and calendar access';
    }
    return `<preference>\n\n${preference}\n\n</preference>`;
};

/**
 * Get the timestamp from the runtime context
 * @param runtimeContext - The runtime context
 * @returns The timestamp
 */
export const getTimestampFromRuntimeContext = (runtimeContext: RuntimeContext) => {
    let timestamp: Date | undefined = runtimeContext.get(TIMESTAMP_CONTEXT_KEY);
    if (!timestamp) {
        console.log('no timestamp found in runtime context, using current date');
        timestamp = new Date();
    }
    return timestamp;
};
