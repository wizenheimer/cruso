import { EmailService } from '../email';
import { EmailData } from '../inbox/types';
import { User } from '@/types/api/users';
import { createUserWithEmail } from '@/db/queries/users';
import { InboxService } from '@/services/inbox';
import {
    getExchangeOwner,
    createExchangeOwner,
    getExchangeById,
} from '@/db/queries/exchange-owners';

export class ExchangeService {
    private static instance: ExchangeService | null = null;
    private emailService: EmailService;

    private constructor() {
        this.emailService = EmailService.getInstance();
    }

    private async getSignature(exchangeId: string): Promise<string> {
        const exchangeOwner = await getExchangeOwner(exchangeId);

        if (exchangeOwner) {
            return `Best,\n\nAssistant of ${exchangeOwner.userEmail}`;
        }

        return `Best,\n\nThe Cruso Team`;
    }

    /**
     * Associate an exchange with a user (used for acting on behalf of users)
     * @param exchangeId - The exchange ID to associate
     * @param userEmail - The user's email
     * @returns Promise<void>
     */
    async associateExchangeWithUser(exchangeId: string, userEmail: string): Promise<void> {
        const { getUserByEmail } = await import('@/db/queries/users');
        const user = await getUserByEmail(userEmail);

        if (user) {
            const existingOwner = await getExchangeOwner(exchangeId);
            if (!existingOwner) {
                await createExchangeOwner(exchangeId, user.id);
            }
        }
    }

    /**
     * Get exchange by ID
     * @param exchangeId - The exchange ID to retrieve
     * @returns Promise<ExchangeOwner | null>
     */
    async getExchange(exchangeId: string) {
        return await getExchangeById(exchangeId);
    }

    public static getInstance(): ExchangeService {
        if (!ExchangeService.instance) {
            ExchangeService.instance = new ExchangeService();
        }
        return ExchangeService.instance;
    }

    /**
     * Onboard a user
     * @param emailData - The email data of the onboarding email
     * @returns The email data of the sent onboarding email
     * @description This method is used to onboard a user
     */
    async handleNewUser(inboundEmailData: EmailData) {
        console.log('onboarding non-user', { inboundEmailData });
        const user = await createUserWithEmail(inboundEmailData.sender);

        if (!user) {
            throw new Error('failed to create user');
        }

        // Associate the current exchange with the new user
        await createExchangeOwner(inboundEmailData.exchangeId, user.id);

        const outboundEmailData = await this.emailService.sendEmail({
            recipients: [user.email],
            subject: 'Welcome to Cruso',
            body: `Hi,

            Welcome to Cruso! We're thrilled to have you on board.

            Quick auth, and we'll get you started.

            https://app.cruso.ai/login

            If you have any questions, please contact us at support@cruso.ai

            Best,

            The Cruso Team`,
            newThread: true, // Force new thread for onboarding
        });

        console.log('sent onboarding email', { outboundEmailData });
        return outboundEmailData;
    }

    /**
     * Handle invalid engagement for existing user
     * @param emailData - The email data of the offboarding email
     * @param user - The user
     * @returns The email data of the sent email
     * @description This method is used when existing user tries to create branches from old threads
     */
    async handleInvalidEngagementForExistingUser(inboundEmailData: EmailData, user: User) {
        console.log('handling invalid engagement for existing user', { inboundEmailData, user });

        const signature = await this.getSignature(inboundEmailData.exchangeId);
        const outboundEmailData = await this.emailService.sendReply(inboundEmailData, {
            type: 'sender-only',
            body: `
            Hi,

            Seems you're trying to reply to an older email in the thread. Instead, consider replying to the latest email in the thread, or creating a new thread altogether.

            ${signature}`,
        });

        console.log('sent invalid engagement email', { outboundEmailData });
        return outboundEmailData;
    }

    /**
     * Handle invalid engagement for non-user
     * @param emailData - The email data of the email
     * @returns The email data of the sent email
     * @description This method is used when non-user tries to create branches from old threads
     */
    async handleInvalidEngagementForNonUser(inboundEmailData: EmailData) {
        console.log('handling invalid engagement for non-user', { inboundEmailData });

        const signature = await this.getSignature(inboundEmailData.exchangeId);
        const outboundEmailData = await this.emailService.sendReply(inboundEmailData, {
            type: 'sender-only',
            body: `
            Hi,

            Seems you're trying to reply to an older email in the thread. Instead, consider replying to the latest email in the thread, or creating a new thread altogether.

            ${signature}`,
        });

        console.log('sent invalid engagement email', { outboundEmailData });
        return outboundEmailData;
    }

    /**
     * Handle engagement for non-user
     * @param emailData - The email data of the email
     * @returns The email data of the sent email
     * @description This method handles non-user exchanges - triggered when Cruso acts on behalf of a user
     */
    async handleEngagementForNonUser(emailData: EmailData) {
        console.log('handling engagement for non-user', { emailData });
        const inboxService = InboxService.getInstance();
        await inboxService.saveEmail(emailData);

        // Determine reply type based on email content
        const replyToMe = emailData.body.includes('reply to me');
        const replyType = replyToMe ? 'sender-only' : 'all-including-sender';

        const signature = await this.getSignature(emailData.exchangeId);

        // NOTE: sender-only mode might not be viable for real world use case tbh
        const sentEmail = await this.emailService.sendReply(emailData, {
            type: replyType,
            body: `You have been pinged!

${signature}`,
        });

        console.log('sent engagement email', { sentEmail });

        // Save the sent email to the database
        const savedEmail = await inboxService.saveEmail(sentEmail);
        console.log('saved engagement email', { savedEmail });

        return sentEmail;
    }

    /**
     * Handle engagement for existing user
     * @param emailData - The email data of the email
     * @param user - The user
     * @returns The email data of the sent email
     * @description This method handles existing user interactions with Cruso
     */
    async handleEngagementForExistingUser(emailData: EmailData, user: User) {
        console.log('handling engagement for existing user', { emailData, user });

        const inboxService = InboxService.getInstance();
        await inboxService.saveEmail(emailData);

        // Create exchange ownership association for new exchanges
        const exchangeOwner = await getExchangeOwner(emailData.exchangeId);
        if (!exchangeOwner) {
            await createExchangeOwner(emailData.exchangeId, user.id);
        }

        // Determine reply type based on email content
        const replyToMe = emailData.body.includes('ping me');
        const replyType = replyToMe ? 'sender-only' : 'all-excluding-sender';

        const signature = await this.getSignature(emailData.exchangeId);

        const sentEmail = await this.emailService.sendReply(emailData, {
            type: replyType,
            body: `You have been pinged!

${signature}`,
        });

        console.log('sent engagement email', { sentEmail });

        // Save the sent email to the database
        await inboxService.saveEmail(sentEmail);
        console.log('saved engagement email', { sentEmail });

        return sentEmail;
    }
}
