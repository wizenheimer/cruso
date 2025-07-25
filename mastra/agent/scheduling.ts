import { Agent } from '@mastra/core/agent';
import { DEFAULT_LARGE_LANGUAGE_MODEL } from '@/constants/model';
import { openai } from '@ai-sdk/openai';
import { calendarTools, preferenceTools } from '../tools';
import { Memory } from '@mastra/memory';
import { storage } from '../storage/pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { User } from '@/types/users';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { preferenceService } from '@/services/preferences/service';
import { USER_CONTEXT_KEY, PREFERENCE_CONTEXT_KEY, TIMESTAMP_CONTEXT_KEY } from '../commons';

/**
 * Cache the prompt at module level
 */
let cachedAgentPrompt: string | null = null;

/**
 * Get the agent prompt
 * @returns The agent prompt
 */
function getAgentPrompt(): string {
    if (cachedAgentPrompt === null) {
        const promptPath = join(process.cwd(), 'mastra', 'prompt', 'scheduling.txt');
        cachedAgentPrompt = readFileSync(promptPath, 'utf-8');
    }
    return cachedAgentPrompt;
}

/**
 * Scheduling agent runtime context
 */
type SchedulingAgentRuntimeContext = {
    user: User;
    preference: string;
    timestamp: Date;
};

/**
 * Scheduling working memory template
 */
export const SchedulingWorkingMemoryTemplate = `
# Scheduling Working Memory

- *Host Name*:

- *Current Objectives (list of objectives)*:

- *Attendee Names (if any)*:

- *Slots Recommended (if any)*:

- *Slots Declined (if any)*:

- *Special Notes (by host, if any)*:

- *Special Notes (by attendees, if any)*:

`;

/**
 * Get the user from the runtime context
 * @param runtimeContext - The runtime context
 * @returns The user
 */
export const getUserFromSchedulingAgentRuntimeContext = (runtimeContext: RuntimeContext) => {
    const user: User = runtimeContext.get(USER_CONTEXT_KEY);
    if (!user) {
        throw new Error('User is required');
    }
    return user;
};

/**
 * Get the user preference from the runtime context
 * @param runtimeContext - The runtime context
 * @returns The user preference
 */
export const getUserPreferenceFromSchedulingAgentRuntimeContext = (
    runtimeContext: RuntimeContext,
) => {
    let preference: string | undefined = runtimeContext.get(PREFERENCE_CONTEXT_KEY);
    if (!preference) {
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
export const getTimestampFromSchedulingAgentRuntimeContext = (runtimeContext: RuntimeContext) => {
    let timestamp: Date | undefined = runtimeContext.get(TIMESTAMP_CONTEXT_KEY);
    if (!timestamp) {
        timestamp = new Date();
    }
    return timestamp;
};

/**
 * Get the agent runtime context
 * @param user - The user
 * @param timestamp - The timestamp
 * @returns The agent runtime context
 */
export const getSchedulingAgentRuntimeContext = async (
    user: User,
    timestamp: Date,
): Promise<RuntimeContext<SchedulingAgentRuntimeContext>> => {
    const context = new RuntimeContext<SchedulingAgentRuntimeContext>();

    context.set(USER_CONTEXT_KEY, user);
    context.set(TIMESTAMP_CONTEXT_KEY, timestamp);

    let preferenceString: string | undefined;
    const preferences = await preferenceService.getPreferences(user.id);
    if (preferences.success && preferences.data?.preferences) {
        preferenceString = preferences.data.preferences.document;
    }

    if (!preferenceString) {
        preferenceString =
            'Make reasonable assumptions based on context, implied preferences, and calendar access\n\n';
    }

    context.set(PREFERENCE_CONTEXT_KEY, `<preference>\n\n${preferenceString}\n\n</preference>`);

    return context;
};

/**
 * Scheduling agent memory
 */
const schedulingAgentMemory = new Memory({
    storage,
    options: {
        workingMemory: {
            enabled: true,
            scope: 'thread',
            template: SchedulingWorkingMemoryTemplate,
        },
        lastMessages: 10,
    },
});

/**
 * Get the agent instructions
 * @param runtimeContext - The runtime context
 * @returns The agent instructions
 */
const getAgentInstructions = ({ runtimeContext }: { runtimeContext: RuntimeContext }) => {
    const user = getUserFromSchedulingAgentRuntimeContext(runtimeContext);
    if (!user) {
        console.error('no user found in runtime context');
    }

    const agentPrompt = getAgentPrompt();

    const preference = getUserPreferenceFromSchedulingAgentRuntimeContext(runtimeContext);

    const timestamp = getTimestampFromSchedulingAgentRuntimeContext(runtimeContext);

    return `${agentPrompt}\n\n<preference>${preference}</preference>\n\n<timestamp>$system_time:${timestamp.toISOString()}</timestamp>`;
};

/**
 * Scheduling agent instance
 */
export const schedulingAgent = new Agent({
    name: 'schedulingAgent',
    instructions: getAgentInstructions,
    tools: {
        ...calendarTools,
        ...preferenceTools,
    },
    model: openai(DEFAULT_LARGE_LANGUAGE_MODEL),
    memory: schedulingAgentMemory,
});
