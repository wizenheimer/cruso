import { Agent } from '@mastra/core/agent';
import {
    DEFAULT_EMAIL_FORMATTING_PROMPT,
    DEFAULT_EMAIL_DRAFTING_TOOLS,
    DEFAULT_EMAIL_DRAFTING_MODEL,
} from '@/constants/flag';
import {
    createAgentConfig,
    getAllowedTools,
    getInferenceConfig,
    getAgentInstructions,
} from '@/mastra/commons';

// Agent configuration for feature flags
const emailDraftingAgentConfig = createAgentConfig(
    'email_drafting_agent',
    DEFAULT_EMAIL_FORMATTING_PROMPT,
    DEFAULT_EMAIL_DRAFTING_TOOLS,
    DEFAULT_EMAIL_DRAFTING_MODEL,
    'emailDraftingAgent',
);

/**
 * Email formatting agent
 */
export const emailDraftingAgent = new Agent({
    name: 'emailDraftingAgent',
    instructions: async ({ runtimeContext }) => {
        return await getAgentInstructions(runtimeContext, emailDraftingAgentConfig);
    },
    tools: async ({ runtimeContext }) => {
        return await getAllowedTools(runtimeContext, emailDraftingAgentConfig);
    },
    model: async ({ runtimeContext }) => {
        return await getInferenceConfig(runtimeContext, emailDraftingAgentConfig);
    },
});
