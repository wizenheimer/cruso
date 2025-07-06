import { Context } from 'hono';
import { EmailData } from '@/services/inbox/content';
import { User } from '@/types/api/users';
import { InboxService } from '@/services/inbox';
import { createUser } from '@/db/queries/users';
import { EmailService } from '@/services/email';
import { uuidv4 } from 'zod/v4';

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

    // Check if the email can branch the exchange
    const isAllowedToBranch = await inboxService.canBranchExchange(emailData);

    // Determine the action based on user status and thread conditions
    const action = determineAction(user, isThreadOpener, isAllowedToBranch);

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
    isAllowedToBranch: boolean,
): 'onboard' | 'engage' | 'offboard' => {
    console.log('determining action', { user, isThreadOpener, isAllowedToBranch });

    if (!user) {
        // Non-user logic
        if (isThreadOpener) return 'onboard';
        return isAllowedToBranch ? 'engage' : 'offboard';
    }

    // Existing user logic
    if (isThreadOpener) return 'engage';
    return isAllowedToBranch ? 'engage' : 'offboard';
};

// executeAction function for executing the determined action
// - it executes the action based on the action type
const executeAction = async (
    action: 'onboard' | 'engage' | 'offboard',
    emailData: EmailData,
    user: User | null,
) => {
    console.log('executing action', { action });

    switch (action) {
        case 'onboard':
            await onboardNonUser(emailData);
            break;
        case 'engage':
            if (user) {
                await engageUser(emailData, user);
            } else {
                await engageNonUser(emailData);
            }
            break;
        case 'offboard':
            if (user) {
                await offboardUser(emailData, user);
            } else {
                await offboardNonUser(emailData);
            }
            break;
    }
};

// - kick off onboarding flow
export const onboardNonUser = async (emailData: EmailData) => {
    console.log('handling new user', { emailData });
    const user = await createUser(emailData.sender);
    console.log('created user', { user });
};

export const engageNonUser = async (emailData: EmailData) => {
    console.log('egaging with a non-user', { emailData });
    const inboxService = InboxService.getInstance();
    console.log('saving email to db', { emailData });
    await inboxService.saveEmail(emailData);
    const emailService = EmailService.getInstance();
    const sentEmail = await emailService.sendReplyToAll(emailData, 'Pong', 'Pong');
    console.log('sent reply email', { sentEmail });
    const savedEmail = await inboxService.saveEmail(sentEmail);
    console.log('saved reply email', { savedEmail });
};

export const engageUser = async (emailData: EmailData, user: User) => {
    console.log('egaging with an existing user', { emailData, user });
    const inboxService = InboxService.getInstance();
    console.log('saving email to db', { emailData });
    await inboxService.saveEmail(emailData);
    const emailService = EmailService.getInstance();
    const sentEmail = await emailService.sendReplyToAll(emailData, 'Pong', 'Pong');
    console.log('sent reply email', { sentEmail });
    const savedEmail = await inboxService.saveEmail(sentEmail);
    console.log('saved reply email', { savedEmail });
};

export const offboardNonUser = async (emailData: EmailData) => {
    console.log('handling existing user', { emailData });
};

export const offboardUser = async (emailData: EmailData, user: User) => {
    console.log('handling existing user', { emailData, user });
};
