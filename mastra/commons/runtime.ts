import { RuntimeContext } from '@mastra/core/runtime-context';
import { User } from '@/types/users';
import {
    USER_CONTEXT_KEY,
    PREFERENCE_CONTEXT_KEY,
    TIMEZONE_CONTEXT_KEY,
    TIMESTAMP_CONTEXT_KEY,
    HOST_CONTEXT_KEY,
    ATTENDEES_CONTEXT_KEY,
} from '@/constants/runtime';
import { Info } from 'luxon';

// ================================
// Runtime Utility Functions
// ================================

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
    let timestamp: number | undefined = runtimeContext.get(TIMESTAMP_CONTEXT_KEY);
    if (!timestamp) {
        console.log('no timestamp found in runtime context, using current date');
        timestamp = Date.now();
    }
    return timestamp;
};

/**
 * Get the timezone from the runtime context
 * @param runtimeContext - The runtime context
 * @returns The timezone
 */
export const getTimezoneFromRuntimeContext = (runtimeContext: RuntimeContext) => {
    let timezone: string | undefined = runtimeContext.get(TIMEZONE_CONTEXT_KEY);
    // Validate the timezone
    if (!timezone || !Info.isValidIANAZone(timezone)) {
        console.warn('invalid timezone, falling back to UTC', timezone);
        timezone = 'UTC';
    }
    return timezone;
};
