import { Context } from 'hono';
import { InboxService } from '@/services/inbox';
import { OnboardingService } from '@/services/onboarding';
import { EmailData } from '@/services/inbox/content';
import { getUserByEmail } from '@/db/queries/users';

const allowedWebhookStatusCode = 200;
const disallowedWebhookStatusCode = 426;

// handleInboxWebhook is triggered by Mailgun's for incoming emails
// It parses the email data and triggers the inbox service to process the email
export const handleInboxWebhook = async (c: Context) => {
    try {
        const inboxService = InboxService.getInstance();
        const emailData = await inboxService.parseInboundWebhook(c);
        console.log('received emailData', emailData);
        if (emailData.messageID === emailData.previousMessageID) {
            await handleOnboarding(emailData);
        }
        return c.json(
            {
                status: 'success',
                message: 'Webhook received',
            },
            allowedWebhookStatusCode,
        );
    } catch (error) {
        console.error('Failed to process webhook:', error);
        return c.json(
            {
                status: 'error',
                message: 'Failed to process webhook',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            disallowedWebhookStatusCode,
        );
    }
};

const handleOnboarding = async (emailData: EmailData) => {
    const user = await getUserByEmail(emailData.sender);
    if (!user) {
        console.error('User not found');
        return;
    }
    const onboardingService = OnboardingService.getInstance();
    const onboardingResponse = await onboardingService.sendWelcomeEmail(user);
    if (!onboardingResponse) {
        console.error('Failed to send welcome email');
        return;
    }
    console.log('Welcome email sent to user', user.email);
};
