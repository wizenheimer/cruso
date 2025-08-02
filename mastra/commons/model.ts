import { RuntimeContext } from '@mastra/core/runtime-context';
import { getUserFromRuntimeContext } from './runtime';
import { getStatsigPrimaryModel, AgentFeatureFlagConfig } from './flag';
import { openai } from '@ai-sdk/openai';

/**
 * Get the primary model
 * @param runtimeContext - The runtime context
 * @param agentConfig - The agent config
 * @returns The primary model
 */
export const getInferenceConfig = async (
    runtimeContext: RuntimeContext,
    agentConfig: AgentFeatureFlagConfig,
) => {
    // Get user info from runtime context
    const user = getUserFromRuntimeContext(runtimeContext);

    const modelConfig = await getStatsigPrimaryModel(user.id, agentConfig);

    // Map provider to actual model function
    try {
        switch (modelConfig.provider) {
            case 'openai':
                return openai(modelConfig.model);
            case 'anthropic':
                // Add anthropic model if you have it
                // return anthropic(modelConfig.model);
                console.warn(
                    `[thirdPersonSchedulingAgent] Anthropic provider not implemented, falling back to OpenAI`,
                );
                return openai(agentConfig.defaultInferenceConfig.model);
            default:
                console.warn(
                    `[thirdPersonSchedulingAgent] Unknown provider '${modelConfig.provider}', falling back to default`,
                );
                return openai(agentConfig.defaultInferenceConfig.model);
        }
    } catch (error) {
        console.error(
            '[thirdPersonSchedulingAgent] Failed to get primaryModel from Statsig:',
            error,
        );
        return openai(agentConfig.defaultInferenceConfig.model);
    }
};
