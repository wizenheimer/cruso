// mastra/flows/third-person-flow.ts
import { EmailData, ExchangeData } from '@/types/exchange';
import { getUserById } from '@/db/queries/users';
import { getThirdPersonSchedulingAgentRuntimeContext } from '../runtime/context';
import { thirdPersonSchedulingAgent } from '../agent/third-person-scheduling';
import { emailDraftFlow } from './email-draft-flow';

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

    const runtimeContext = await getThirdPersonSchedulingAgentRuntimeContext(
        user,
        emailData,
        exchangeData,
    );

    // Combine subject and body for the agent
    const stringifiedEmailContent = `${emailData.subject}: ${emailData.body}`;

    const result = await thirdPersonSchedulingAgent.generate(stringifiedEmailContent, {
        maxSteps: 10, // Allow up to 10 tool usage steps
        resourceId: exchangeData.exchangeOwnerId,
        threadId: emailData.exchangeId,
        runtimeContext,
    });

    const resultWithSignature = result.text + `\n${emailSignature}`;

    return emailDraftFlow(resultWithSignature, user);
}
