// mastra/flows/email-draft-flow.ts
import { z } from 'zod';
import { emailDraftingAgent } from '../agent/email-drafting';
import { User } from '@/types/users';
import { getEmailDraftingAgentRuntimeContext } from '../runtime/context';

/**
 * Format email text
 */
export async function emailDraftFlow(
    originalText: string,
    user: User,
): Promise<{
    success: boolean;
    content: string;
}> {
    try {
        const runtimeContext = await getEmailDraftingAgentRuntimeContext(user);
        const result = await emailDraftingAgent.generate(originalText, {
            output: z.object({
                htmlContent: z
                    .string()
                    .describe(
                        'Formatted and validated HTML email, without any additional text or explanations',
                    ),
                isValid: z.boolean().describe('Whether the HTML was formatted and validated'),
            }),
            runtimeContext,
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
