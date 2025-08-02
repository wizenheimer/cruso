// mastra/runtime/context.ts
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
import { EmailData, ExchangeData } from '@/types/exchange';
import { preferenceService } from '@/services/preferences';

// Helper function to log context setting
const logContextSetting = (agentName: string, contextKey: string, value: any) => {
    console.log('='.repeat(50));
    console.log(`[${agentName}] Setting context: ${contextKey}`);
    console.log(`[${agentName}] Value:`, JSON.stringify(value, null, 2));
    console.log('='.repeat(50));
};

// ================================
// Email Drafting Agent Runtime Context
// ================================

/**
 * Email drafting agent runtime context
 */
type emailDraftingAgentRuntimeContext = {
    user: User;
};

/**
 * Get the runtime context for the email drafting agent
 */
export const getEmailDraftingAgentRuntimeContext = async (
    user: User,
): Promise<RuntimeContext<emailDraftingAgentRuntimeContext>> => {
    const context = new RuntimeContext<emailDraftingAgentRuntimeContext>();

    context.set(USER_CONTEXT_KEY, user);
    logContextSetting('emailDraftingAgent', USER_CONTEXT_KEY, user);

    return context;
};

// ================================
// Third Person Scheduling Agent Runtime Context
// ================================

/**
 * Scheduling agent runtime context
 */
type thirdPersonSchedulingAgentRuntimeContext = {
    user: User;
    preference: string;
    timestamp: number; // Unix timestamp in milliseconds
    timezone: string;
    host: string;
    attendees: string[];
};

/**
 * Get the agent runtime context
 * @param user - The user
 * @param timestamp - The timestamp
 * @returns The agent runtime context
 */
export const getThirdPersonSchedulingAgentRuntimeContext = async (
    user: User,
    emailData: EmailData,
    exchangeData: ExchangeData,
): Promise<RuntimeContext<thirdPersonSchedulingAgentRuntimeContext>> => {
    const context = new RuntimeContext<thirdPersonSchedulingAgentRuntimeContext>();

    context.set(USER_CONTEXT_KEY, user);
    logContextSetting('thirdPersonSchedulingAgent', USER_CONTEXT_KEY, user);

    context.set(TIMESTAMP_CONTEXT_KEY, emailData.timestamp);
    logContextSetting('thirdPersonSchedulingAgent', TIMESTAMP_CONTEXT_KEY, emailData.timestamp);

    context.set(HOST_CONTEXT_KEY, exchangeData.sender);
    logContextSetting('thirdPersonSchedulingAgent', HOST_CONTEXT_KEY, exchangeData.sender);

    context.set(ATTENDEES_CONTEXT_KEY, exchangeData.recipients);
    logContextSetting('thirdPersonSchedulingAgent', ATTENDEES_CONTEXT_KEY, exchangeData.recipients);

    let preferenceString: string | undefined;
    let timezone: string | undefined;
    const preferences = await preferenceService.getPreferences(user.id);
    if (preferences.success && preferences.data?.preferences) {
        preferenceString = preferences.data.preferences.document;
        timezone = preferences.data.preferences.timezone;
    }

    if (!timezone) {
        timezone = 'UTC';
    }

    if (!preferenceString) {
        preferenceString =
            'Make reasonable assumptions based on context, implied preferences, and calendar access.';
    }

    context.set(PREFERENCE_CONTEXT_KEY, preferenceString);
    logContextSetting('thirdPersonSchedulingAgent', PREFERENCE_CONTEXT_KEY, preferenceString);

    context.set(TIMEZONE_CONTEXT_KEY, timezone);
    logContextSetting('thirdPersonSchedulingAgent', TIMEZONE_CONTEXT_KEY, timezone);

    return context;
};

// ================================
// First Person Scheduling Agent Runtime Context
// ================================

/**
 * Scheduling agent runtime context
 */
export type FirstPersonSchedulingAgentRuntimeContext = {
    user: User;
    preference: string;
    timestamp: number;
    timezone: string;
    host: string;
    attendees: string[];
};

/**
 * Get the runtime context for the first person scheduling agent
 * @param user - The user
 * @param emailData - The email data
 * @param exchangeData - The exchange data
 * @returns The runtime context
 */
export const getFirstPersonSchedulingAgentRuntimeContext = async (
    user: User,
    emailData: EmailData,
    exchangeData: ExchangeData,
): Promise<RuntimeContext<FirstPersonSchedulingAgentRuntimeContext>> => {
    const context = new RuntimeContext<FirstPersonSchedulingAgentRuntimeContext>();

    context.set(USER_CONTEXT_KEY, user);
    logContextSetting('firstPersonSchedulingAgent', USER_CONTEXT_KEY, user);

    context.set(TIMESTAMP_CONTEXT_KEY, emailData.timestamp);
    logContextSetting('firstPersonSchedulingAgent', TIMESTAMP_CONTEXT_KEY, emailData.timestamp);

    context.set(HOST_CONTEXT_KEY, exchangeData.sender);
    logContextSetting('firstPersonSchedulingAgent', HOST_CONTEXT_KEY, exchangeData.sender);

    context.set(ATTENDEES_CONTEXT_KEY, exchangeData.recipients);
    logContextSetting('firstPersonSchedulingAgent', ATTENDEES_CONTEXT_KEY, exchangeData.recipients);

    let preferenceString: string | undefined;
    let timezone: string | undefined;
    const preferences = await preferenceService.getPreferences(user.id);
    if (preferences.success && preferences.data?.preferences) {
        preferenceString = preferences.data.preferences.document;
        timezone = preferences.data.preferences.timezone;
    }

    if (!timezone) {
        console.warn('no timezone found in preferences, falling back to UTC');
        timezone = 'UTC';
    }

    if (!preferenceString) {
        preferenceString =
            'Make reasonable assumptions based on context, implied preferences, and calendar access.';
    }

    context.set(PREFERENCE_CONTEXT_KEY, preferenceString);
    logContextSetting('firstPersonSchedulingAgent', PREFERENCE_CONTEXT_KEY, preferenceString);

    context.set(TIMEZONE_CONTEXT_KEY, timezone);
    logContextSetting('firstPersonSchedulingAgent', TIMEZONE_CONTEXT_KEY, timezone);

    return context;
};

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
