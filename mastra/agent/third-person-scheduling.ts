import { Agent } from '@mastra/core/agent';
import {
    DEFAULT_THIRD_PERSON_SCHEDULING_PROMPT,
    DEFAULT_THIRD_PERSON_SCHEDULING_TOOLS,
    DEFAULT_THIRD_PERSON_SCHEDULING_MODEL,
} from '@/constants/flag';
import { User } from '@/types/users';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { preferenceService } from '@/services/preferences/service';
import {
    USER_CONTEXT_KEY,
    PREFERENCE_CONTEXT_KEY,
    TIMESTAMP_CONTEXT_KEY,
    HOST_CONTEXT_KEY,
    ATTENDEES_CONTEXT_KEY,
    TIMEZONE_CONTEXT_KEY,
} from '@/constants/runtime';
import { EmailData, ExchangeData } from '@/types/exchange';
import { agentMemory } from '@/mastra/memory';
import {
    createAgentConfig,
    getAgentInstructions,
    getAllowedTools,
    getInferenceConfig,
} from '@/mastra/commons';

// Helper function to log context setting
const logContextSetting = (agentName: string, contextKey: string, value: any) => {
    console.log('='.repeat(50));
    console.log(`[${agentName}] Setting context: ${contextKey}`);
    console.log(`[${agentName}] Value:`, JSON.stringify(value, null, 2));
    console.log('='.repeat(50));
};

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
 * Agent configuration for feature flags
 */
const thirdPersonSchedulingAgentConfig = createAgentConfig(
    'third_party_scheduling_agent',
    DEFAULT_THIRD_PERSON_SCHEDULING_PROMPT,
    DEFAULT_THIRD_PERSON_SCHEDULING_TOOLS,
    DEFAULT_THIRD_PERSON_SCHEDULING_MODEL,
    'thirdPersonSchedulingAgent',
);

/**
 * Scheduling agent instance
 */
export const thirdPersonSchedulingAgent = new Agent({
    name: 'thirdPersonSchedulingAgent',
    instructions: async ({ runtimeContext }) => {
        return await getAgentInstructions(runtimeContext, thirdPersonSchedulingAgentConfig);
    },
    tools: async ({ runtimeContext }) => {
        return await getAllowedTools(runtimeContext, thirdPersonSchedulingAgentConfig);
    },
    model: async ({ runtimeContext }) => {
        return await getInferenceConfig(runtimeContext, thirdPersonSchedulingAgentConfig);
    },
    memory: agentMemory,
});

/**
 * Get the agent runtime context
 * @param user - The user
 * @param timestamp - The timestamp
 * @returns The agent runtime context
 */
export const getthirdPersonSchedulingAgentRuntimeContext = async (
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
