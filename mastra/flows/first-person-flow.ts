// mastra/flows/first-person-flow.ts
import { User } from '@/types/users';
import { EmailData, ExchangeData } from '@/types/exchange';
import { firstPersonSchedulingAgent } from '../agent/first-person-scheduling';
import { getFirstPersonSchedulingAgentRuntimeContext } from '../runtime/context';
import { emailDraftFlow } from './email-draft-flow';

/**
 * Handle first party flow
 */
export async function handleFirstPartyFlow(
    user: User,
    signature: string,
    emailData: EmailData,
    exchangeData: ExchangeData,
) {
    const runtimeContext = await getFirstPersonSchedulingAgentRuntimeContext(
        user,
        emailData,
        exchangeData,
    );

    // Combine subject and body for the agent
    const stringifiedEmailContent = `${emailData.subject}: ${emailData.body}`;

    const result = await firstPersonSchedulingAgent.generate(stringifiedEmailContent, {
        maxSteps: 10, // Allow up to 10 tool usage steps
        resourceId: exchangeData.exchangeOwnerId,
        threadId: emailData.exchangeId,
        runtimeContext,
    });

    const resultWithSignature = result.text + `\n${signature}`;

    return emailDraftFlow(resultWithSignature, user);
}
