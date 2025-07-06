import { EmailService } from '../email';
import { EmailData } from '../inbox/content';
import { User } from '@/types/api/users';
import { createUser, getUserByEmail } from '@/db/queries/users';
import { InboxService } from '../inbox';

export class ExchangeService {
    private static instance: ExchangeService | null = null;
    private emailService: EmailService;

    private constructor() {
        this.emailService = EmailService.getInstance();
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
    async handleNewUser(emailData: EmailData) {
        console.log('onboarding non-user', { emailData });
        const user = await createUser(emailData.sender);

        if (!user) {
            throw new Error('Failed to create user');
        }

        const sentEmail = await this.emailService.sendEmailToNewThread(
            [user.email],
            'Welcome to Cruso',
            `Hi,

            Looks like you're new here! Welcome to Cruso!

            We're excited to have you on board.

            You can find your account at https://app.cruso.ai/login

            If you have any questions, please contact us at support@cruso.ai

            Best,

            The Cruso Team
            `,
        );

        console.log('sent onboarding email', { sentEmail });
    }

    /**
     * Offboard a user
     * @param emailData - The email data of the offboarding email
     * @returns The email data of the sent offboarding email
     * @description This method is used to offboard a user
     */
    async handleInvalidEngagementForExistingUser(emailData: EmailData, user: User) {
        console.log('handling invalid engagement for existing user', { emailData, user });

        // Send an email to let the user know they cannot create branches from old threads
        const sentEmail = await this.emailService.sendReplyOnlyToSender(
            emailData,
            `Hi,

            Seems you're trying to reply to an older email in the thread. Instead, consider replying to the latest email in the thread, or creating a new thread altogether.

            Best,

            The Cruso Team
            `,
        );

        console.log('sent offboarding email', { sentEmail });
    }

    /**
     * Offboard a user
     * @param emailData - The email data of the offboarding email
     * @returns The email data of the sent offboarding email
     * @description This method is used to offboard a user
     */
    async handleInvalidEngagementForNonUser(emailData: EmailData) {
        console.log('handling invalid engagement for non-user', { emailData });

        // Send an email to let the user know they cannot create branches from old threads
        const sentEmail = await this.emailService.sendReplyOnlyToSender(
            emailData,
            `Hi,

            Hmm, it looks like you're trying to reply to an older email in the thread. Instead consider replying the latest email in the thread.

            Best,

            The Cruso Team
            `,
        );

        console.log('sent offboarding email', { sentEmail });
    }

    /**
     * Handle an existing user
     * @param emailData - The email data of the email
     * @param user - The user
     * @returns The email data of the sent email
     * @description This method is used to handle a non user exchange - this is triggered when cruso acts on behalf of a user and interacts with the recipients (such as in coordination flow or rescheduling flow)
     */
    async handleEngagementForNonUser(emailData: EmailData) {
        console.log('handling engagement for non-user', { emailData });
        const inboxService = InboxService.getInstance();
        await inboxService.saveEmail(emailData);

        // Send a reply to the user if they pinged us
        let sentEmail: EmailData;

        const replyToMe = emailData.body.includes('reply to me');
        if (replyToMe) {
            sentEmail = await this.emailService.sendReplyToOriginalSender(emailData, 'Pong');
        } else {
            sentEmail = await this.emailService.sendReplyToAllIncludingSender(emailData, 'Pong');
        }
    }

    /**
     * Handle an existing user
     * @param emailData - The email data of the email
     * @param user - The user
     * @returns The email data of the sent email
     * @description This method is used to handle an existing user - this is triggered when a user interacts with cruso
     */
    async handleEngagementForExistingUser(emailData: EmailData, user: User) {
        console.log('handling engagement for existing user', { emailData, user });

        const inboxService = InboxService.getInstance();
        await inboxService.saveEmail(emailData);

        // Send a reply to the user if they pinged us
        let sentEmail: EmailData;

        const replyToMe = emailData.body.includes('ping me');
        if (replyToMe) {
            sentEmail = await this.emailService.sendReplyOnlyToSender(emailData, 'Pong');
        } else {
            sentEmail = await this.emailService.sendReplyToAllRecipientsExcludingSender(
                emailData,
                'Pong',
            );
        }

        console.log('sent engagement email', { sentEmail });

        // Save the sent email to the database
        await inboxService.saveEmail(sentEmail);
        console.log('saved engagement email', { sentEmail });
    }
}
