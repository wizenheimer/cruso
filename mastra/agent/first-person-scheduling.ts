import { Agent } from '@mastra/core/agent';
import {
    DEFAULT_FIRST_PERSON_SCHEDULING_MODEL,
    DEFAULT_FIRST_PERSON_SCHEDULING_PROMPT,
    DEFAULT_FIRST_PERSON_SCHEDULING_TOOLS,
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
type SchedulingAgentRuntimeContext = {
    user: User;
    preference: string;
    timestamp: number;
    timezone: string;
    host: string;
    attendees: string[];
};

/**
 * Agent configuration for feature flags
 */
const firstPersonSchedulingAgentConfig = createAgentConfig(
    'first_party_scheduling_agent',
    DEFAULT_FIRST_PERSON_SCHEDULING_PROMPT,
    DEFAULT_FIRST_PERSON_SCHEDULING_TOOLS,
    DEFAULT_FIRST_PERSON_SCHEDULING_MODEL,
    'firstPersonSchedulingAgent',
);

/**
 * Scheduling agent instance
 */
export const firstPersonSchedulingAgent = new Agent({
    name: 'firstPersonSchedulingAgent',
    instructions: async ({ runtimeContext }) => {
        return await getAgentInstructions(runtimeContext, firstPersonSchedulingAgentConfig);
    },
    tools: async ({ runtimeContext }) => {
        return await getAllowedTools(runtimeContext, firstPersonSchedulingAgentConfig);
    },
    model: async ({ runtimeContext }) => {
        return await getInferenceConfig(runtimeContext, firstPersonSchedulingAgentConfig);
    },
    memory: agentMemory,
});

/**
 * Get the runtime context for the first person scheduling agent
 * @param user - The user
 * @param emailData - The email data
 * @param exchangeData - The exchange data
 * @returns The runtime context
 */
export const getfirstPersonSchedulingAgentRuntimeContext = async (
    user: User,
    emailData: EmailData,
    exchangeData: ExchangeData,
): Promise<RuntimeContext<SchedulingAgentRuntimeContext>> => {
    const context = new RuntimeContext<SchedulingAgentRuntimeContext>();

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
