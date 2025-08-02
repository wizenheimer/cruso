import { RuntimeContext } from '@mastra/core/runtime-context';
import { AgentFeatureFlagConfig, getStatsigAllowedTools } from './flag';
import { getUserFromRuntimeContext } from './runtime';
import { calendarTools, emailTools, preferenceTools } from '../tools';

/**
 * Get the allowed tools
 * @param runtimeContext - The runtime context
 * @param agentConfig - The agent config
 * @returns The allowed tools
 */
export const getAllowedTools = async (
    runtimeContext: RuntimeContext,
    agentConfig: AgentFeatureFlagConfig,
) => {
    // Get user info from runtime context
    const user = getUserFromRuntimeContext(runtimeContext);

    const allowedToolNames = await getStatsigAllowedTools(user.id, agentConfig);

    // Map tool names to actual tool functions
    const allAvailableTools = {
        ...calendarTools,
        ...preferenceTools,
        ...emailTools,
    };

    // Filter tools based on allowed list from Statsig
    const filteredTools: Record<string, any> = {};
    for (const toolName of allowedToolNames) {
        if (toolName in allAvailableTools) {
            filteredTools[toolName] = (allAvailableTools as any)[toolName];
        } else {
            console.warn(
                `[${agentConfig.agentName}] Tool '${toolName}' not found in available tools`,
            );
        }
    }

    console.log(
        `[${agentConfig.agentName}] Returning ${Object.keys(filteredTools).length} allowed tools:`,
        Object.keys(filteredTools),
    );

    return filteredTools;
};
