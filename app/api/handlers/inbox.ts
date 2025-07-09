import { Context } from 'hono';
import { EmailData } from '@/services/inbox/types';
import { User } from '@/types/api/users';
import { InboxService } from '@/services/inbox/index';
import { ExchangeService } from '@/services/exchange';

/**
 * The status code to return for allowed webhook requests
 */
const allowedWebhookStatusCode = 200;

/**
 * Handle the inbox request
 * @param c - The context object
 * @returns The response object
 */
export const handleInboxRequest = async (c: Context) => {
    // The webhook middleware has already processed the webhook
    // and stored emailData in the context
    const emailData = c.get('emailData');
    const user = c.get('user');

    if (!emailData) {
        throw new Error('Email data not found in context');
    }

    const inboxService = InboxService.getInstance();

    // Check if the email is the first message in the exchange
    const isThreadOpener = await inboxService.isFirstMessageInExchange(emailData);

    // Check if the email is a valid reply to the exchange
    const isValidEngagement = await inboxService.isValidEngagement(emailData);

    // Determine the action based on user status and thread conditions
    const action = determineAction(user, isThreadOpener, isValidEngagement);

    console.log('determined action', { action });

    // Execute the determined action
    await executeAction(action, emailData, user);

    // Return the success response
    return c.json(
        {
            status: 'success',
            message: 'Inbox webhook processed',
            sender: emailData.sender,
        },
        allowedWebhookStatusCode,
    );
};

/**
 * Determine the appropriate action
 * @param user - The user object
 * @param isThreadOpener - Whether the email is the first message in the exchange
 * @param isValidEngagement - Whether the email is a valid reply to the exchange
 * @returns The action to take
 */
const determineAction = (
    user: User | null,
    isThreadOpener: boolean,
    isValidEngagement: boolean,
): 'onboard' | 'engage' | 'offboard' => {
    console.log('determining action', { user, isThreadOpener, isValidEngagement });

    if (!user) {
        // If it is a thread opener, but the user isn't onboarded, onboard them first
        if (isThreadOpener) return 'onboard';
        // Or else, if it's not a thread opener, then only engage if the engagement is valid
        return isValidEngagement ? 'engage' : 'offboard';
    }

    // Existing user logic
    // If it is a thread opener, then engage with the user
    if (isThreadOpener) return 'engage';
    // If it is not a thread opener, then only engage if the engagement is valid
    return isValidEngagement ? 'engage' : 'offboard';
};

/**
 * Execute the determined action
 * @param action - The action to take
 * @param emailData - The email data
 * @param user - The user object
 */
const executeAction = async (
    action: 'onboard' | 'engage' | 'offboard',
    emailData: EmailData,
    user: User | null,
) => {
    console.log('executing action', { action });

    const exchangeService = ExchangeService.getInstance();

    switch (action) {
        case 'onboard':
            await exchangeService.handleNewUser(emailData);
            break;
        case 'engage':
            if (user) {
                await exchangeService.handleEngagementForExistingUser(emailData, user);
            } else {
                await exchangeService.handleEngagementForNonUser(emailData);
            }
            break;
        case 'offboard':
            if (user) {
                await exchangeService.handleInvalidEngagementForExistingUser(emailData, user);
            } else {
                await exchangeService.handleInvalidEngagementForNonUser(emailData);
            }
            break;
    }
};
