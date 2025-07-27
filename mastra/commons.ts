import { RuntimeContext } from '@mastra/core/runtime-context';
import { User } from '@/types/users';
import { PinoLogger } from '@mastra/loggers';
import { readFileSync } from 'fs';
import { existsSync } from 'fs';
import { join } from 'path';

export const USER_CONTEXT_KEY = 'user';
export const PREFERENCE_CONTEXT_KEY = 'preference';
export const TIMESTAMP_CONTEXT_KEY = 'timestamp';
export const HOST_CONTEXT_KEY = 'host';
export const ATTENDEES_CONTEXT_KEY = 'attendees';

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
 * Get the host from the runtime context
 * @param runtimeContext - The runtime context
 * @returns The host
 */
export const getHostFromRuntimeContext = (runtimeContext: RuntimeContext) => {
    // Filter out any email address that are from crusolabs.com domain
    const host = runtimeContext.get(HOST_CONTEXT_KEY) as string;
    if (!host) {
        return '';
    }
    if (host.includes('@crusolabs.com')) {
        return '';
    }
    return host;
};

/**
 * Get the attendees from the runtime context
 * @param runtimeContext - The runtime context
 * @returns The attendees
 */
export const getAttendeesFromRuntimeContext = (runtimeContext: RuntimeContext) => {
    // Filter out any email address that are from crusolabs.com domain
    const attendees = runtimeContext.get(ATTENDEES_CONTEXT_KEY) as string[];
    if (!attendees || !Array.isArray(attendees)) {
        return [];
    }
    return attendees.filter((attendee) => !attendee.includes('@crusolabs.com'));
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

/**
 * Get the agent prompt
 * @returns The agent prompt
 */
export async function getBasePromptForAgent(
    defaultPrompt: string,
    localPromptPath?: string,
    remotePromptPath?: string,
): Promise<string> {
    if (localPromptPath) {
        const promptPath = join(process.cwd(), 'mastra', 'prompt', localPromptPath);

        // Try to read from local file first
        if (existsSync(promptPath)) {
            try {
                return readFileSync(promptPath, 'utf-8');
            } catch (error) {
                console.warn('Failed to read local prompt file:', error);
            }
        }
    }

    // Fallback to URL if local file doesn't exist or failed to read
    if (remotePromptPath) {
        try {
            const response = await fetch(remotePromptPath);
            if (response.ok) {
                return await response.text();
            } else {
                throw new Error(`Failed to fetch prompt from URL: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to fetch prompt from URL:', error);
        }
    }

    return defaultPrompt;
}

export const getTimestampPrompt = (timestamp: Date) => {
    return `# Current Time\n
    Remember, today is ${timestamp}. This timestamp is the sole reference for determining all scheduling times. Anchor to this exact date value for the duration of this exchange. No exceptions. Every event, timeslot, deadline, or conflict must be evaluated and resolved with this EXACT timestamp (${timestamp}) in mind. Always make sure to use the correct date and resolve conflicts based on this date. Use this timestamp ONLY for determining time and DO NOT use it for determining timezones.`;
};

export const getHostPrompt = (host: string) => {
    return `# Host\n
    The host is ${host}.`;
};

export const getAttendeesPrompt = (attendees: string[]) => {
    return `# Attendees\n
    The attendees are ${attendees.join(', ')}.`;
};

export const getPreferencePrompt = (preference: string) => {
    return `# Executive's Preferences\n
    ${preference.trim()}`;
};
