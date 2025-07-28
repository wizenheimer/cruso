import { Agent } from '@mastra/core/agent';
import { DEFAULT_LARGE_LANGUAGE_MODEL } from '@/constants/model';
import { openai } from '@ai-sdk/openai';
import { thirdPartyCalendarTools, thirdPartyPreferenceTools } from '../tools';
import { Memory } from '@mastra/memory';
import { storage } from '../storage/pg';
import { User } from '@/types/users';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { preferenceService } from '@/services/preferences/service';
import {
    USER_CONTEXT_KEY,
    PREFERENCE_CONTEXT_KEY,
    TIMESTAMP_CONTEXT_KEY,
    getUserFromRuntimeContext,
    getUserPreferenceFromRuntimeContext,
    getTimestampFromRuntimeContext,
    HOST_CONTEXT_KEY,
    ATTENDEES_CONTEXT_KEY,
    getHostFromRuntimeContext,
    getAttendeesFromRuntimeContext,
    getBasePromptForAgent,
    getPreferencePrompt,
    getTimestampPrompt,
    getHostPrompt,
    getAttendeesPrompt,
    TIMEZONE_CONTEXT_KEY,
    getTimezoneFromRuntimeContext,
} from '../commons';
import { EmailData, ExchangeData } from '@/types/exchange';

// Helper function to log context setting
const logContextSetting = (agentName: string, contextKey: string, value: any) => {
    console.log('='.repeat(50));
    console.log(`[${agentName}] Setting context: ${contextKey}`);
    console.log(`[${agentName}] Value:`, JSON.stringify(value, null, 2));
    console.log('='.repeat(50));
};

/**
 * Cache the prompt at module level
 */
let baseThirdPartySchedulingPrompt: string | null = null;

/**
 * Scheduling agent runtime context
 */
type ThirdPartySchedulingAgentRuntimeContext = {
    user: User;
    preference: string;
    timestamp: number; // Unix timestamp in milliseconds
    timezone: string;
    host: string;
    attendees: string[];
};

/**
 * Default prompt
 */
const defaultPrompt = `You are cruso, a seasoned executive assistant specializing in scheduling negotiations with external parties. Your primary objective is to facilitate scheduling agreements between your executive and third parties, suggesting slots, performing availability checks, handling counteroffers, constraint management, and relationship preservation with minimal back-and-forth to ensure successful booking.`;

/**
 * Get the agent runtime context
 * @param user - The user
 * @param timestamp - The timestamp
 * @returns The agent runtime context
 */
export const getThirdPartySchedulingAgentRuntimeContext = async (
    user: User,
    emailData: EmailData,
    exchangeData: ExchangeData,
): Promise<RuntimeContext<ThirdPartySchedulingAgentRuntimeContext>> => {
    const context = new RuntimeContext<ThirdPartySchedulingAgentRuntimeContext>();

    context.set(USER_CONTEXT_KEY, user);
    logContextSetting('thirdPartySchedulingAgent', USER_CONTEXT_KEY, user);

    context.set(TIMESTAMP_CONTEXT_KEY, emailData.timestamp);
    logContextSetting('thirdPartySchedulingAgent', TIMESTAMP_CONTEXT_KEY, emailData.timestamp);

    context.set(HOST_CONTEXT_KEY, exchangeData.sender);
    logContextSetting('thirdPartySchedulingAgent', HOST_CONTEXT_KEY, exchangeData.sender);

    context.set(ATTENDEES_CONTEXT_KEY, exchangeData.recipients);
    logContextSetting('thirdPartySchedulingAgent', ATTENDEES_CONTEXT_KEY, exchangeData.recipients);

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
    logContextSetting('thirdPartySchedulingAgent', PREFERENCE_CONTEXT_KEY, preferenceString);

    context.set(TIMEZONE_CONTEXT_KEY, timezone);
    logContextSetting('thirdPartySchedulingAgent', TIMEZONE_CONTEXT_KEY, timezone);

    return context;
};

/**
 * Scheduling agent memory
 */
const thirdPartySchedulingAgentMemory = new Memory({
    storage,
    options: {
        lastMessages: 10,
    },
});

/**
 * Get the agent instructions
 * @param runtimeContext - The runtime context
 * @returns The agent instructions
 */
const getAgentInstructions = async ({ runtimeContext }: { runtimeContext: RuntimeContext }) => {
    const user = getUserFromRuntimeContext(runtimeContext);
    if (!user) {
        console.error('no user found in runtime context');
    }

    if (baseThirdPartySchedulingPrompt === null) {
        baseThirdPartySchedulingPrompt = await getBasePromptForAgent(
            defaultPrompt,
            process.env.TPSCHEDULING_AGENT_PROMPT_FILE,
            process.env.TPSCHEDULING_AGENT_PROMPT_URI,
        );
    }

    // Base prompt -- Section 1
    const basePrompt = baseThirdPartySchedulingPrompt;

    // Timestamp -- Section 2
    const timestamp = getTimestampFromRuntimeContext(runtimeContext);
    const timezone = getTimezoneFromRuntimeContext(runtimeContext);
    const timestampPrompt = getTimestampPrompt(timestamp, timezone);

    // Host -- Section 3
    const host = getHostFromRuntimeContext(runtimeContext);
    const hostPrompt = getHostPrompt(host);

    // Attendees -- Section 4
    const attendees = getAttendeesFromRuntimeContext(runtimeContext);
    const attendeesPrompt = getAttendeesPrompt(attendees);

    // Preference -- Section 5
    const preference = getUserPreferenceFromRuntimeContext(runtimeContext);
    const preferencePrompt = getPreferencePrompt(preference);

    return `
    ${basePrompt.trim()}\n
    ${timestampPrompt}\n
    ${hostPrompt}\n
    ${attendeesPrompt}\n
    ${preferencePrompt}
    `;
};

/**
 * Scheduling agent instance
 */
export const thirdPartySchedulingAgent = new Agent({
    name: 'thirdPartySchedulingAgent',
    instructions: getAgentInstructions,
    tools: {
        ...thirdPartyCalendarTools,
        ...thirdPartyPreferenceTools,
    },
    model: openai(DEFAULT_LARGE_LANGUAGE_MODEL),
    memory: thirdPartySchedulingAgentMemory,
});
