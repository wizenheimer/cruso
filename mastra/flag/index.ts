// mastra/commons/flag.ts
import { Statsig, StatsigUser } from '@statsig/statsig-node-core';

// ================================
// Statsig Feature Flag Utilities
// ================================

const statsig = new Statsig(process.env.STATSIG_SERVER_KEY!);
const statsigInitialized = statsig.initialize();

/**
 * Configuration for agent feature flags
 */
export interface AgentFeatureFlagConfig {
    flagId: string;
    defaultInstructions: string;
    defaultTools: string[];
    defaultInferenceConfig: { model: string; provider: string };
    agentName: string;
}

/**
 * Get prompt from Statsig with fallback
 */
export const getStatsigPrompt = async (
    userId: string,
    config: AgentFeatureFlagConfig,
): Promise<string> => {
    try {
        await statsigInitialized;

        const statsigUser = new StatsigUser({
            userID: userId,
        });

        const dynamicConfig = statsig.getDynamicConfig(statsigUser, config.flagId);
        const prompt = dynamicConfig.getValue('prompt', config.defaultInstructions);

        console.log(`[${config.agentName}] Got prompt from Statsig for user`);
        return prompt;
    } catch (error) {
        console.error(`[${config.agentName}] Failed to get prompt from Statsig:`, error);
        return config.defaultInstructions;
    }
};

/**
 * Get allowed tools from Statsig with fallback
 */
export const getStatsigAllowedTools = async (
    userId: string,
    config: AgentFeatureFlagConfig,
): Promise<string[]> => {
    try {
        await statsigInitialized;

        const statsigUser = new StatsigUser({
            userID: userId,
        });

        const dynamicConfig = statsig.getDynamicConfig(statsigUser, config.flagId);
        const allowedTools = dynamicConfig.getValue('tools', config.defaultTools);

        console.log(
            `[${config.agentName}] Got allowedTools from Statsig for user ${userId}:`,
            allowedTools,
        );
        return allowedTools;
    } catch (error) {
        console.error(`[${config.agentName}] Failed to get allowedTools from Statsig:`, error);
        return config.defaultTools;
    }
};

/**
 * Get primary model from Statsig with fallback
 */
export const getStatsigPrimaryModel = async (
    userId: string,
    config: AgentFeatureFlagConfig,
): Promise<{ model: string; provider: string }> => {
    try {
        await statsigInitialized;

        const statsigUser = new StatsigUser({
            userID: userId,
        });

        const dynamicConfig = statsig.getDynamicConfig(statsigUser, config.flagId);
        const primaryModel = dynamicConfig.getValue('inference', config.defaultInferenceConfig);

        console.log(
            `[${config.agentName}] Got primaryModel from Statsig for user ${userId}:`,
            primaryModel,
        );
        return primaryModel;
    } catch (error) {
        console.error(`[${config.agentName}] Failed to get primaryModel from Statsig:`, error);
        return config.defaultInferenceConfig;
    }
};

/**
 * Create agent configuration for feature flags
 */
export const createAgentConfig = (
    flagId: string,
    defaultInstructions: string,
    defaultTools: string[],
    defaultInferenceConfig: { model: string; provider: string },
    agentName: string,
): AgentFeatureFlagConfig => ({
    flagId,
    defaultInstructions,
    defaultTools,
    defaultInferenceConfig,
    agentName,
});
