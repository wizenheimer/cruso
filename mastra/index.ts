import { z } from 'zod';
import { Mastra } from '@mastra/core/mastra';
import { storage } from './storage/pg';
import { logger } from './commons';
import {
    firstPartySchedulingAgent,
    getFirstPartySchedulingAgentRuntimeContext,
} from './agent/fpscheduling';
import {
    getThirdPartySchedulingAgentRuntimeContext,
    thirdPartySchedulingAgent,
} from './agent/tpscheduling';
import { emailFormattingAgent } from './agent/formatter';
import { EmailData, ExchangeData } from '@/types/exchange';
import { User } from '@/types/users';
import { getUserById } from '@/db/queries/users';

/**
 * Mastra - It is used to create the workflow and agent.
 */
export const mastra = new Mastra({
    agents: {
        firstPartySchedulingAgent,
        thirdPartySchedulingAgent,
        emailFormattingAgent,
    },
    storage,
    logger,
});

/**
 * Format email text
 */
async function formatEmailText(originalText: string): Promise<{
    success: boolean;
    content: string;
}> {
    try {
        const result = await emailFormattingAgent.generate(originalText, {
            output: z.object({
                htmlContent: z
                    .string()
                    .describe(
                        'Formatted and validated HTML email, without any additional text or explanations',
                    ),
                isValid: z.boolean().describe('Whether the HTML was formatted and validated'),
            }),
        });

        return {
            success: true,
            content:
                result.object.isValid && result.object.htmlContent
                    ? result.object.htmlContent
                    : originalText,
        };
    } catch (error) {
        return {
            success: false,
            content: originalText,
        };
    }
}

/**
 * Handle third party flow
 */
export async function handleThirdPartyFlow(
    emailData: EmailData,
    emailSignature: string,
    exchangeData: ExchangeData,
) {
    const user = await getUserById(exchangeData.exchangeOwnerId);
    if (!user) {
        throw new Error('User not found');
    }

    const runtimeContext = await getThirdPartySchedulingAgentRuntimeContext(
        user,
        emailData,
        exchangeData,
    );

    const result = await thirdPartySchedulingAgent.generate(emailData.body, {
        maxSteps: 10, // Allow up to 10 tool usage steps
        resourceId: exchangeData.exchangeOwnerId,
        threadId: emailData.exchangeId,
        runtimeContext,
    });

    const resultWithSignature = result.text + `\n${emailSignature}`;

    return formatEmailText(resultWithSignature);
}

/**
 * Handle first party flow
 */
export async function handleFirstPartyFlow(
    user: User,
    signature: string,
    emailData: EmailData,
    exchangeData: ExchangeData,
) {
    const runtimeContext = await getFirstPartySchedulingAgentRuntimeContext(
        user,
        emailData,
        exchangeData,
    );

    const result = await firstPartySchedulingAgent.generate(emailData.body, {
        maxSteps: 10, // Allow up to 10 tool usage steps
        resourceId: exchangeData.exchangeOwnerId,
        threadId: emailData.exchangeId,
        runtimeContext,
    });

    const resultWithSignature = result.text + `\n${signature}`;

    return formatEmailText(resultWithSignature);
}
