import { RuntimeContext } from '@mastra/core/runtime-context';
import { AgentFeatureFlagConfig } from './flag';
import { getUserFromRuntimeContext } from './runtime';
import {
    getTimestampPrompt,
    getHostPrompt,
    getAttendeesPrompt,
    getPreferencePrompt,
} from './prompt';
import { getStatsigPrompt } from './flag';
import {
    getTimezoneFromRuntimeContext,
    getTimestampFromRuntimeContext,
    getHostFromRuntimeContext,
    getAttendeesFromRuntimeContext,
    getUserPreferenceFromRuntimeContext,
} from './runtime';

/**
 * Get the agent instructions
 * @param runtimeContext - The runtime context
 * @param agentConfig - The agent configuration
 * @returns The agent instructions
 */
export const getAgentInstructions = async (
    runtimeContext: RuntimeContext,
    agentConfig: AgentFeatureFlagConfig,
) => {
    const user = getUserFromRuntimeContext(runtimeContext);
    if (!user) {
        console.error('no user found in runtime context');
    }

    // Get prompt from Statsig
    const basePrompt = await getStatsigPrompt(user.id, agentConfig);

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
