import { Agent } from '@mastra/core/agent';
import { DEFAULT_SMALL_LANGUAGE_MODEL } from '@/constants/model';
import {
    DEFAULT_EMAIL_FORMATTING_PROMPT,
    DEFAULT_EMAIL_DRAFTING_TOOLS,
    DEFAULT_EMAIL_DRAFTING_MODEL,
} from '@/constants/flag';
import { openai } from '@ai-sdk/openai';
import { emailTools } from '@/mastra/tools';
import { Statsig, StatsigUser } from '@statsig/statsig-node-core';
import { getUserFromRuntimeContext } from '../commons';

const statsig = new Statsig(process.env.STATSIG_SERVER_KEY!);
const statsigInitialized = statsig.initialize();

const getStatsigPrompt = async (userId: string, flagId: string): Promise<string> => {
    try {
        await statsigInitialized;

        const statsigUser = new StatsigUser({
            userID: userId,
        });

        const config = statsig.getDynamicConfig(statsigUser, flagId);
        const prompt = config.getValue('prompt', DEFAULT_EMAIL_FORMATTING_PROMPT);

        console.log(`[emailDraftingAgent] Got prompt from Statsig for user ${userId}: ${prompt}`);
        return prompt;
    } catch (error) {
        console.error('[emailDraftingAgent] Failed to get prompt from Statsig:', error);
        return DEFAULT_EMAIL_FORMATTING_PROMPT;
    }
};

const getStatsigAllowedTools = async (userId: string, flagId: string): Promise<string[]> => {
    try {
        await statsigInitialized;

        const statsigUser = new StatsigUser({
            userID: userId,
        });

        const config = statsig.getDynamicConfig(statsigUser, flagId);
        const allowedTools = config.getValue('tools', ['validateEmailHTMLTool']);

        console.log(
            `[emailDraftingAgent] Got allowedTools from Statsig for user ${userId}:`,
            allowedTools,
        );
        return allowedTools;
    } catch (error) {
        console.error('[emailDraftingAgent] Failed to get allowedTools from Statsig:', error);
        // Return default tools on error
        return DEFAULT_EMAIL_DRAFTING_TOOLS;
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
        const primaryModel = config.getValue('inference', DEFAULT_EMAIL_DRAFTING_MODEL);

        console.log(
            `[emailDraftingAgent] Got primaryModel from Statsig for user ${userId}:`,
            primaryModel,
        );
        return primaryModel;
    } catch (error) {
        console.error('[emailDraftingAgent] Failed to get primaryModel from Statsig:', error);
        // Return default model on error
        return DEFAULT_EMAIL_DRAFTING_MODEL;
    }
};

/**
 * Agent instructions
 */
const getAgentInstructions = async ({ runtimeContext }: { runtimeContext: any }) => {
    // Get user info from runtime context if available
    const user = getUserFromRuntimeContext(runtimeContext);

    // Get prompt from Statsig
    const basePrompt = await getStatsigPrompt(user.id, 'email_drafting_agent');

    return `
    ${basePrompt.trim()}
    Convert this text to clean HTML email format. Use validateEmailHTMLTool to ensure it's valid. Return only the HTML content, no additional text or explanations.
    `;
};

const getAllowedTools = async ({ runtimeContext }: { runtimeContext: any }) => {
    // Get user info from runtime context
    const user = getUserFromRuntimeContext(runtimeContext);

    const allowedToolNames = await getStatsigAllowedTools(user.id, 'email_drafting_agent');

    // Map tool names to actual tool functions
    const allAvailableTools = {
        ...emailTools,
    };

    // Filter tools based on allowed list from Statsig
    const filteredTools: Record<string, any> = {};
    for (const toolName of allowedToolNames) {
        if (toolName in allAvailableTools) {
            filteredTools[toolName] = (allAvailableTools as any)[toolName];
        } else {
            console.warn(`[emailDraftingAgent] Tool '${toolName}' not found in available tools`);
        }
    }

    console.log(
        `[emailDraftingAgent] Returning ${Object.keys(filteredTools).length} allowed tools:`,
        Object.keys(filteredTools),
    );

    return filteredTools;
};

const getPrimaryModel = async ({ runtimeContext }: { runtimeContext: any }) => {
    // Get user info from runtime context
    const user = getUserFromRuntimeContext(runtimeContext);

    const modelConfig = await getStatsigPrimaryModel(user.id, 'email_drafting_agent');

    // Map provider to actual model function
    try {
        switch (modelConfig.provider) {
            case 'openai':
                return openai(modelConfig.model);
            case 'anthropic':
                console.warn(
                    `[emailDraftingAgent] Anthropic provider not implemented, falling back to OpenAI`,
                );
                return openai(DEFAULT_EMAIL_DRAFTING_MODEL.model);
            default:
                console.warn(
                    `[emailDraftingAgent] Unknown provider '${modelConfig.provider}', falling back to default`,
                );
                return openai(DEFAULT_EMAIL_DRAFTING_MODEL.model);
        }
    } catch (error) {
        console.error('[emailDraftingAgent] Failed to get primaryModel from Statsig:', error);
        return openai(DEFAULT_EMAIL_DRAFTING_MODEL.model);
    }
};

/**
 * Email formatting agent
 */
export const emailDraftingAgent = new Agent({
    name: 'emailDraftingAgent',
    instructions: getAgentInstructions,
    tools: getAllowedTools,
    model: getPrimaryModel,
});

/**
 * Usage:
 *
 * const result = await formatEmailText("Hey John, just wanted to follow up...");
 *
 * if (result.success) {
 *     console.log('Formatted HTML:', result.html);
 * }
 */
