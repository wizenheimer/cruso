import { Agent } from '@mastra/core/agent';
import { DEFAULT_LARGE_LANGUAGE_MODEL } from '@/constants/model';
import { openai } from '@ai-sdk/openai';
import { calendarTools, preferenceTools } from '../tools';
import { Memory } from '@mastra/memory';
import { storage } from '../storage/pg';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
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
} from '../commons';

/**
 * Cache the prompt at module level
 */
let cachedAgentPrompt: string | null = null;

/**
 * Get the agent prompt
 * @returns The agent prompt
 */
async function getAgentPrompt(): Promise<string> {
    if (cachedAgentPrompt === null) {
        const promptPath = join(process.cwd(), 'mastra', 'prompt', 'scheduling.txt');

        // Try to read from local file first
        if (existsSync(promptPath)) {
            try {
                cachedAgentPrompt = readFileSync(promptPath, 'utf-8');
            } catch (error) {
                console.warn('Failed to read local prompt file:', error);
            }
        }

        // Fallback to URL if local file doesn't exist or failed to read
        if (!cachedAgentPrompt) {
            try {
                const response = await fetch(
                    'https://gist.githubusercontent.com/wizenheimer/192ce0af1560aa1c9ffa1075f84f3561/raw/c4a375ec5929ed83b9325655dff6dc2f7b4c6256/cruso-prompt',
                );
                if (response.ok) {
                    cachedAgentPrompt = await response.text();
                } else {
                    throw new Error(`Failed to fetch prompt from URL: ${response.status}`);
                }
            } catch (error) {
                console.error('Failed to fetch prompt from URL:', error);
                // Provide a minimal fallback prompt
                cachedAgentPrompt = `You are cruso, a seasoned executive assistant specializing in calendar management and scheduling. Your primary objective is to manage calendars on behalf of the user, handling scheduling, rescheduling, availability checks, conflict resolution, and preference management with minimal back-and-forth to ensure task completion.`;
            }
        }
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
// export const SchedulingWorkingMemoryTemplate = `
// # Scheduling Working Memory

// - *Host Name*:

// - *Current Objectives (list of objectives)*:

// - *Attendee Names (if any)*:

// - *Slots Recommended (if any)*:

// - *Slots Declined (if any)*:

// - *Special Notes (by host, if any)*:

// - *Special Notes (by attendees, if any)*:

// `;

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
            'Make reasonable assumptions based on context, implied preferences, and calendar access.';
    }

    context.set(PREFERENCE_CONTEXT_KEY, preferenceString);
    return context;
};

/**
 * Scheduling agent memory
 */
const schedulingAgentMemory = new Memory({
    storage,
    options: {
        // workingMemory: {
        //     enabled: true,
        //     scope: 'thread',
        //     template: SchedulingWorkingMemoryTemplate,
        // },
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

    const agentPrompt = await getAgentPrompt();

    const preference = getUserPreferenceFromRuntimeContext(runtimeContext);

    const timestamp = getTimestampFromRuntimeContext(runtimeContext);

    return `
    ${agentPrompt.trim()}\n
    # Current Time\n
    Remember, today is ${timestamp}. This timestamp is the sole reference for determining all scheduling times. Anchor to this exact date value for the duration of this exchange. No exceptions. Every event, timeslot, deadline, or conflict must be evaluated and resolved with this EXACT timestamp (${timestamp}) in mind. Always make sure to use the correct date and resolve conflicts based on this date. Use this timestamp ONLY for determining time and DO NOT use it for determining timezones.\n
    # Default Preferences\n
    ${preference.trim()}\n
    `;
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
