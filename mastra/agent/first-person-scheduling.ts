// mastra/agent/first-person-scheduling.ts
import { Agent } from '@mastra/core/agent';
import {
    DEFAULT_FIRST_PERSON_SCHEDULING_MODEL,
    DEFAULT_FIRST_PERSON_SCHEDULING_PROMPT,
    DEFAULT_FIRST_PERSON_SCHEDULING_TOOLS,
} from '@/constants/flag';
import { agentMemory } from '../memory';
import { createAgentConfig } from '../flag';
import { getAgentInstructions } from '../prompt';
import { getAllowedTools } from '../tools';
import { getInferenceConfig } from '../inference';

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
