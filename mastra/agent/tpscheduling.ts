import { Agent } from '@mastra/core/agent';
import { DEFAULT_LARGE_LANGUAGE_MODEL } from '@/constants/model';
import { openai } from '@ai-sdk/openai';
import { thirdPartyCalendarTools, thirdPartyPreferenceTools } from '../tools';
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
    HOST_CONTEXT_KEY,
    ATTENDEES_CONTEXT_KEY,
    getHostFromRuntimeContext,
    getAttendeesFromRuntimeContext,
} from '../commons';
import { EmailData, ExchangeData } from '@/types/exchange';

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
        const promptPath = join(process.cwd(), 'mastra', 'prompt', 'tpscheduling.txt');

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
                    'https://gist.githubusercontent.com/wizenheimer/2f6988eb0771ae366bbd4d6aa19a9bbb/raw/57e4338b3e87e7a90ec5f281a2e893f30f090aa7/tpscheduling.txt',
                );
                if (response.ok) {
                    cachedAgentPrompt = await response.text();
                } else {
                    throw new Error(`Failed to fetch prompt from URL: ${response.status}`);
                }
            } catch (error) {
                console.error('Failed to fetch prompt from URL:', error);
                // Provide a minimal fallback prompt
                cachedAgentPrompt = `You are cruso, a seasoned executive assistant specializing in scheduling negotiations with external parties. Your primary objective is to facilitate scheduling agreements between your executive and third parties, suggesting slots, performing availability checks, handling counteroffers, constraint management, and relationship preservation with minimal back-and-forth to ensure successful booking.`;
            }
        }
    }
    return cachedAgentPrompt;
}

/**
 * Scheduling agent runtime context
 */
type ThirdPartySchedulingAgentRuntimeContext = {
    user: User;
    preference: string;
    timestamp: Date;
    host: string;
    attendees: string[];
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
export const getThirdPartySchedulingAgentRuntimeContext = async (
    user: User,
    emailData: EmailData,
    exchangeData: ExchangeData,
): Promise<RuntimeContext<ThirdPartySchedulingAgentRuntimeContext>> => {
    const context = new RuntimeContext<ThirdPartySchedulingAgentRuntimeContext>();

    context.set(USER_CONTEXT_KEY, user);
    context.set(TIMESTAMP_CONTEXT_KEY, emailData.timestamp);
    context.set(HOST_CONTEXT_KEY, exchangeData.sender);
    context.set(ATTENDEES_CONTEXT_KEY, exchangeData.recipients);

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
const thirdPartySchedulingAgentMemory = new Memory({
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

    const host = getHostFromRuntimeContext(runtimeContext);

    const attendees = getAttendeesFromRuntimeContext(runtimeContext);

    return `
    ${agentPrompt.trim()}\n
    # Current Time\n
    Remember, today is ${timestamp}. This timestamp is the sole reference for determining all scheduling times. Anchor to this exact date value for the duration of this exchange. No exceptions. Every event, timeslot, deadline, or conflict must be evaluated and resolved with this EXACT timestamp (${timestamp}) in mind. Always make sure to use the correct date and resolve conflicts based on this date. Use this timestamp ONLY for determining time and DO NOT use it for determining timezones.\n
    # Host\n
    The host is ${host}.\n
    # Attendees\n
    The attendees are ${attendees.join(', ')}.\n
    # Executive's Preferences\n
    ${preference.trim()}\n
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
