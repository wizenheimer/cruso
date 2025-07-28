import { Agent } from '@mastra/core/agent';
import { DEFAULT_LARGE_LANGUAGE_MODEL, DEFAULT_SMALL_LANGUAGE_MODEL } from '@/constants/model';
import { openai } from '@ai-sdk/openai';
import { calendarTools, preferenceTools } from '../tools';
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
    getAttendeesFromRuntimeContext,
    getHostFromRuntimeContext,
    getBasePromptForAgent,
    getTimestampPrompt,
    getHostPrompt,
    getAttendeesPrompt,
    getPreferencePrompt,
    getTimezoneFromRuntimeContext,
    TIMEZONE_CONTEXT_KEY,
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
let baseFirstPartySchedulingPrompt: string | null = null;

/**
 * Scheduling agent runtime context
 */
type SchedulingAgentRuntimeContext = {
    user: User;
    preference: string;
    timestamp: number; // Unix timestamp in milliseconds
    timezone: string;
    host: string;
    attendees: string[];
};

const defaultPrompt = `You are cruso, a seasoned executive assistant specializing in calendar management and scheduling. Your primary objective is to manage calendars on behalf of the user, handling scheduling, rescheduling, availability checks, conflict resolution, and preference management with minimal back-and-forth to ensure task completion.`;

/**
 * Get the agent runtime context
 * @param user - The user
 * @param timestamp - The timestamp
 * @returns The agent runtime context
 */
export const getFirstPartySchedulingAgentRuntimeContext = async (
    user: User,
    emailData: EmailData,
    exchangeData: ExchangeData,
): Promise<RuntimeContext<SchedulingAgentRuntimeContext>> => {
    const context = new RuntimeContext<SchedulingAgentRuntimeContext>();

    context.set(USER_CONTEXT_KEY, user);
    logContextSetting('firstPartySchedulingAgent', USER_CONTEXT_KEY, user);

    context.set(TIMESTAMP_CONTEXT_KEY, emailData.timestamp);
    logContextSetting('firstPartySchedulingAgent', TIMESTAMP_CONTEXT_KEY, emailData.timestamp);

    context.set(HOST_CONTEXT_KEY, exchangeData.sender);
    logContextSetting('firstPartySchedulingAgent', HOST_CONTEXT_KEY, exchangeData.sender);

    context.set(ATTENDEES_CONTEXT_KEY, exchangeData.recipients);
    logContextSetting('firstPartySchedulingAgent', ATTENDEES_CONTEXT_KEY, exchangeData.recipients);

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
    logContextSetting('firstPartySchedulingAgent', PREFERENCE_CONTEXT_KEY, preferenceString);

    context.set(TIMEZONE_CONTEXT_KEY, timezone);
    logContextSetting('firstPartySchedulingAgent', TIMEZONE_CONTEXT_KEY, timezone);

    return context;
};

/**
 * Scheduling agent memory
 */
const schedulingAgentMemory = new Memory({
    storage,
    options: {
        threads: {
            generateTitle: {
                model: openai(DEFAULT_SMALL_LANGUAGE_MODEL), // Use cheaper model for titles
                instructions:
                    'Generate a concise title for the email exchange. The title should be a single sentence that captures the essence of the conversation.',
            },
        },
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

    if (baseFirstPartySchedulingPrompt === null) {
        baseFirstPartySchedulingPrompt = await getBasePromptForAgent(
            defaultPrompt,
            process.env.FPSCHEDULING_AGENT_PROMPT_FILE,
            process.env.FPSCHEDULING_AGENT_PROMPT_URI,
        );
    }

    // Base prompt -- Section 1
    const basePrompt = baseFirstPartySchedulingPrompt;

    // Timestamp -- Section 2
    const timezone = getTimezoneFromRuntimeContext(runtimeContext);
    const timestamp = getTimestampFromRuntimeContext(runtimeContext);
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

    // Return the prompt
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
export const firstPartySchedulingAgent = new Agent({
    name: 'firstPartySchedulingAgent',
    instructions: getAgentInstructions,
    tools: {
        ...calendarTools,
        ...preferenceTools,
    },
    model: openai(DEFAULT_LARGE_LANGUAGE_MODEL),
    memory: schedulingAgentMemory,
});
