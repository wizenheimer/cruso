// mastra/tools/index.ts
import { RuntimeContext } from '@mastra/core/runtime-context';
import { AgentFeatureFlagConfig, getStatsigAllowedTools } from '../flag';
import { getUserFromRuntimeContext } from '../runtime/context';
import {
    createEvent,
    modifyEvent,
    cancelEvent,
    viewCalendarEvents,
    searchCalendarEvents,
    checkBusyStatus,
    initiateReschedulingOverEmailWithHostAndAttendees,
    initiateSchedulingOverEmailWithHostAndAttendees,
    findBookableSlots,
} from './event';
import { getSchedulingDefaults, updateSchedulingDefaults } from './preference';
import { validateEmailHTMLTool } from './email';

/**
 * Export calendar tools
 */
export const calendarTools = {
    createEvent,
    modifyEvent,
    cancelEvent,
    viewCalendarEvents,
    searchCalendarEvents,
    checkBusyStatus,
    findBookableSlots,
    initiateReschedulingOverEmailWithHostAndAttendees,
    initiateSchedulingOverEmailWithHostAndAttendees,
};

/**
 * Export preference tools
 */
export const preferenceTools = {
    getSchedulingDefaults,
    updateSchedulingDefaults,
};

/**
 * Export the focused HTML validation tool
 */
export const emailTools = {
    validateEmailHTMLTool,
};

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
