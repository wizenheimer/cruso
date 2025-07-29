import { Context } from 'hono';
import { EmailData } from '@/types/exchange';
import { User } from '@/types/users';
import { ExchangeService } from '@/services/exchange';
import { isAllowedListEntry, setAllowedListEntries } from '@/db/queries/allowed-list';
import {
    USER_MIDDLEWARE_CONTEXT_KEY,
    EMAIL_DATA_MIDDLEWARE_CONTEXT_KEY,
} from '@/constants/middleware';

/**
 * The status code to return for allowed webhook requests
 */
const allowedWebhookStatusCode = 200;

/**
 * Handle the inbox webhook request and process incoming emails
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with processing status or error message
 */
export const handleInboxRequest = async (requestContext: Context) => {
    // The webhook middleware has already processed the webhook
    // and stored emailData in the context
    const incomingEmailData = requestContext.get(EMAIL_DATA_MIDDLEWARE_CONTEXT_KEY);
    const authenticatedUser = requestContext.get(USER_MIDDLEWARE_CONTEXT_KEY);

    if (!incomingEmailData) {
        throw new Error('Email data not found in context');
    }

    console.log('Processing webhook for message', {
        messageId: incomingEmailData.messageId,
        sender: incomingEmailData.sender,
        exchangeId: incomingEmailData.exchangeId,
    });

    const exchangeService = ExchangeService.getInstance();

    // Check if the email is the first message in the exchange
    const isEmailThreadOpener = await exchangeService.isFirstMessageInExchange(incomingEmailData);

    // Check if the email is a valid reply to the exchange
    const isValidEmailEngagement = await exchangeService.isValidEngagement(incomingEmailData);

    // Determine the action based on user status and thread conditions
    const determinedAction = determineAction(
        authenticatedUser,
        isEmailThreadOpener,
        isValidEmailEngagement,
    );

    console.log('determined action', { action: determinedAction });

    // Execute the determined action
    await executeAction(determinedAction, incomingEmailData, authenticatedUser);

    // Return the success response
    return requestContext.json(
        {
            status: 'success',
            message: 'Inbox webhook processed',
            sender: incomingEmailData.sender,
        },
        allowedWebhookStatusCode,
    );
};

/**
 * Determine the appropriate action based on user status and email context
 * @param authenticatedUser - The user object (null if not authenticated)
 * @param isEmailThreadOpener - Whether the email is the first message in the exchange
 * @param isValidEmailEngagement - Whether the email is a valid reply to the exchange
 * @returns The action to take ('onboard', 'engage', or 'offboard')
 */
const determineAction = (
    authenticatedUser: User | null,
    isEmailThreadOpener: boolean,
    isValidEmailEngagement: boolean,
): 'onboard' | 'engage' | 'offboard' => {
    console.log('determining action', {
        user: authenticatedUser,
        isThreadOpener: isEmailThreadOpener,
        isValidEngagement: isValidEmailEngagement,
    });

    if (!authenticatedUser) {
        // If it is a thread opener, but the user isn't onboarded, onboard them first
        if (isEmailThreadOpener) return 'onboard';
        // Or else, if it's not a thread opener, then only engage if the engagement is valid
        return isValidEmailEngagement ? 'engage' : 'offboard';
    }

    // Existing user logic
    // If it is a thread opener, then engage with the user
    if (isEmailThreadOpener) return 'engage';
    // If it is not a thread opener, then only engage if the engagement is valid
    return isValidEmailEngagement ? 'engage' : 'offboard';
};

/**
 * Execute the determined action based on the email and user context
 * @param actionToExecute - The action to take ('onboard', 'engage', or 'offboard')
 * @param incomingEmailData - The email data from the webhook
 * @param authenticatedUser - The user object (null if not authenticated)
 */
const executeAction = async (
    actionToExecute: 'onboard' | 'engage' | 'offboard',
    incomingEmailData: EmailData,
    authenticatedUser: User | null,
) => {
    console.log('executing action', {
        action: actionToExecute,
        messageId: incomingEmailData.messageId,
        user: authenticatedUser?.id,
    });

    const exchangeService = ExchangeService.getInstance();
    const isAllowed = await isAllowedSender(incomingEmailData);
    switch (actionToExecute) {
        case 'onboard':
            await exchangeService.handleNewUser(incomingEmailData);
            break;
        case 'engage':
            if (!isAllowed) {
                console.log('skipping engagement for non-allowed sender');
                return;
            }
            if (authenticatedUser) {
                await exchangeService.handleEngagementForExistingUser(
                    incomingEmailData,
                    authenticatedUser,
                );
            } else {
                await exchangeService.handleEngagementForNonUser(incomingEmailData);
            }
            break;
        case 'offboard':
            if (!isAllowed) {
                console.log('skipping engagement for non-allowed sender');
                return;
            }
            if (authenticatedUser) {
                await exchangeService.handleInvalidEngagementForExistingUser(
                    incomingEmailData,
                    authenticatedUser,
                );
            } else {
                await exchangeService.handleInvalidEngagementForNonUser(incomingEmailData);
            }
            break;
    }
};

/**
 * Handles spam emails by adding the sender and recipients to the allowed list.
 *
 * @param {RawEmailData} emailData - The email data to handle
 */
async function isAllowedSender(emailData: EmailData): Promise<boolean> {
    // Check if the sender is in allowed list
    const isAllowed = await isAllowedListEntry(emailData.sender);
    if (!isAllowed) {
        return false;
    }

    // Add the receiptis to the allowed list if they are not already in the allowed list
    const recipients = emailData.recipients;
    try {
        await setAllowedListEntries(recipients, true);
    } catch (error) {
        console.warn('warning: error adding recipients to allowed list:', error);
    }

    return true;
}
