import { Context } from 'hono';
import { EmailData } from '@/services/inbox/content';
import { User } from '@/types/api/users';
import { InboxService } from '@/services/inbox';
import { ExchangeService } from '@/services/exchange';

// allowedWebhookStatusCode is the status code to return for allowed webhook requests
const allowedWebhookStatusCode = 200;

// handleInboxRequest function for processing inbox requests
export const handleInboxRequest = async (c: Context) => {
    // The webhook middleware has already processed the webhook
    // and stored emailData in the context
    const emailData = c.get('emailData');
    const user = c.get('user');

    console.log('handling inbox request', { emailData, user });

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

// determineAction function for determining the appropriate action
// - it determines the action based on the user status and thread conditions
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

// executeAction function for executing the determined action
// - it executes the action based on the action type
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
