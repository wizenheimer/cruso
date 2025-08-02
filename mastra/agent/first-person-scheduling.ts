import { Agent } from '@mastra/core/agent';
import {
    DEFAULT_FIRST_PERSON_SCHEDULING_PROMPT,
    DEFAULT_FIRST_PERSON_SCHEDULING_TOOLS,
    DEFAULT_FIRST_PERSON_SCHEDULING_MODEL,
} from '@/constants/flag';
import { openai } from '@ai-sdk/openai';
import { calendarTools, preferenceTools } from '../tools';
import { User } from '@/types/users';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { preferenceService } from '@/services/preferences/service';
import { Statsig, StatsigUser } from '@statsig/statsig-node-core';
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
    getTimestampPrompt,
    getHostPrompt,
    getAttendeesPrompt,
    getPreferencePrompt,
    getTimezoneFromRuntimeContext,
    TIMEZONE_CONTEXT_KEY,
} from '../commons';
import { EmailData, ExchangeData } from '@/types/exchange';
import { agentMemory } from '../memory';

const statsig = new Statsig(process.env.STATSIG_SERVER_KEY!);
const statsigInitialized = statsig.initialize();

// Helper function to log context setting
const logContextSetting = (agentName: string, contextKey: string, value: any) => {
    console.log('='.repeat(50));
    console.log(`[${agentName}] Setting context: ${contextKey}`);
    console.log(`[${agentName}] Value:`, JSON.stringify(value, null, 2));
    console.log('='.repeat(50));
};

type SchedulingAgentRuntimeContext = {
    user: User;
    preference: string;
    timestamp: number;
    timezone: string;
    host: string;
    attendees: string[];
};

/**
 * Get prompt from Statsig
 * @param user - The user
 * @returns The prompt
 */
const getStatsigPrompt = async (userId: string, flagId: string): Promise<string> => {
    try {
        await statsigInitialized;

        const statsigUser = new StatsigUser({
            userID: userId,
        });

        const config = statsig.getDynamicConfig(statsigUser, flagId);
        const prompt = config.getValue('prompt', DEFAULT_FIRST_PERSON_SCHEDULING_PROMPT);

        console.log(
            `[firstPersonSchedulingAgent] Got prompt from Statsig for user ${userId}: ${prompt}`,
        );
        return prompt;
    } catch (error) {
        console.error('[firstPersonSchedulingAgent] Failed to get prompt from Statsig:', error);
        return DEFAULT_FIRST_PERSON_SCHEDULING_PROMPT;
    }
};

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

    // Get prompt from Statsig
    const basePrompt = await getStatsigPrompt(user.id, 'first_party_scheduling_agent');

    // Keep all your existing prompt building logic
    const timezone = getTimezoneFromRuntimeContext(runtimeContext);
    const timestamp = getTimestampFromRuntimeContext(runtimeContext);
    const timestampPrompt = getTimestampPrompt(timestamp, timezone);

    const host = getHostFromRuntimeContext(runtimeContext);
    const hostPrompt = getHostPrompt(host);

    const attendees = getAttendeesFromRuntimeContext(runtimeContext);
    const attendeesPrompt = getAttendeesPrompt(attendees);

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

const getStatsigAllowedTools = async (userId: string, flagId: string): Promise<string[]> => {
    try {
        await statsigInitialized;

        const statsigUser = new StatsigUser({
            userID: userId,
        });

        const config = statsig.getDynamicConfig(statsigUser, flagId);
        const allowedTools = config.getValue('tools', DEFAULT_FIRST_PERSON_SCHEDULING_TOOLS);

        console.log(
            `[firstPersonSchedulingAgent] Got allowedTools from Statsig for user ${userId}:`,
            allowedTools,
        );
        return allowedTools;
    } catch (error) {
        console.error(
            '[firstPersonSchedulingAgent] Failed to get allowedTools from Statsig:',
            error,
        );
        // Return default tools on error
        return DEFAULT_FIRST_PERSON_SCHEDULING_TOOLS;
    }
};

const getStatsigPrimaryModel = async (
    userId: string,
    flagId: string,
): Promise<{ model: string; provider: string }> => {
    try {
        await statsigInitialized;

        const statsigUser = new StatsigUser({
            userID: userId,
        });

        const config = statsig.getDynamicConfig(statsigUser, flagId);
        const primaryModel = config.getValue('inference', DEFAULT_FIRST_PERSON_SCHEDULING_MODEL);

        console.log(
            `[firstPersonSchedulingAgent] Got primaryModel from Statsig for user ${userId}:`,
            primaryModel,
        );
        return primaryModel;
    } catch (error) {
        console.error(
            '[firstPersonSchedulingAgent] Failed to get primaryModel from Statsig:',
            error,
        );
        // Return default model on error
        return DEFAULT_FIRST_PERSON_SCHEDULING_MODEL;
    }
};

const getAllowedTools = async ({ runtimeContext }: { runtimeContext: RuntimeContext }) => {
    // Get user info from runtime context
    const user = getUserFromRuntimeContext(runtimeContext);

    const allowedToolNames = await getStatsigAllowedTools(user.id, 'first_party_scheduling_agent');

    // Map tool names to actual tool functions
    const allAvailableTools = {
        ...calendarTools,
        ...preferenceTools,
    };

    // Filter tools based on allowed list from Statsig
    const filteredTools: Record<string, any> = {};
    for (const toolName of allowedToolNames) {
        if (toolName in allAvailableTools) {
            filteredTools[toolName] = (allAvailableTools as any)[toolName];
        } else {
            console.warn(
                `[firstPersonSchedulingAgent] Tool '${toolName}' not found in available tools`,
            );
        }
    }

    console.log(
        `[firstPersonSchedulingAgent] Returning ${Object.keys(filteredTools).length} allowed tools:`,
        Object.keys(filteredTools),
    );

    return filteredTools;
};

const getPrimaryModel = async ({ runtimeContext }: { runtimeContext: RuntimeContext }) => {
    // Get user info from runtime context
    const user = getUserFromRuntimeContext(runtimeContext);

    const modelConfig = await getStatsigPrimaryModel(user.id, 'first_party_scheduling_agent');

    // Map provider to actual model function (you'll need to adjust this based on your model setup)
    try {
        switch (modelConfig.provider) {
            case 'openai':
                return openai(modelConfig.model);
            case 'anthropic':
                // Add anthropic model if you have it
                // return anthropic(modelConfig.model);
                console.warn(
                    `[firstPersonSchedulingAgent] Anthropic provider not implemented, falling back to OpenAI`,
                );
                return openai(DEFAULT_FIRST_PERSON_SCHEDULING_MODEL.model);
            default:
                console.warn(
                    `[firstPersonSchedulingAgent] Unknown provider '${modelConfig.provider}', falling back to default`,
                );
                return openai(DEFAULT_FIRST_PERSON_SCHEDULING_MODEL.model);
        }
    } catch (error) {
        console.error(
            '[firstPersonSchedulingAgent] Failed to get primaryModel from Statsig:',
            error,
        );
        return openai(DEFAULT_FIRST_PERSON_SCHEDULING_MODEL.model);
    }
};

/**
 * Scheduling agent instance
 */
export const firstPersonSchedulingAgent = new Agent({
    name: 'firstPersonSchedulingAgent',
    instructions: getAgentInstructions,
    tools: getAllowedTools,
    model: getPrimaryModel,
    memory: agentMemory,
});
