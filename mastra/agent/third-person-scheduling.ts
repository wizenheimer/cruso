// mastra/agent/third-person-scheduling.ts
import { Agent } from '@mastra/core/agent';
import {
    DEFAULT_THIRD_PERSON_SCHEDULING_PROMPT,
    DEFAULT_THIRD_PERSON_SCHEDULING_TOOLS,
    DEFAULT_THIRD_PERSON_SCHEDULING_MODEL,
} from '@/constants/flag';
import { agentMemory } from '../memory';
import { createAgentConfig } from '../flag';
import { getAgentInstructions } from '../prompt';
import { getAllowedTools } from '../tools';
import { getInferenceConfig } from '../inference';

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
