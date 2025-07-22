import { EmailData, RawEmailData } from './types';
import { ExchangeDataService } from './exchangeDataService';
import { EmailParsingService } from './parsing';
import { EmailService } from '../email';
import { Context } from 'hono';
import { randomUUID } from 'crypto';
import { cleanTextContent, generatePrefixForBody } from './parsing/text';
import {
    ONBOARDING_EMAIL_SUBJECT,
    ONBOARDING_EMAIL_TEMPLATE,
    USER_REPLYING_TO_OLDER_EMAIL_TEMPLATE,
    NON_USER_REPLYING_TO_OLDER_EMAIL_TEMPLATE,
} from '@/constants/email';
import { ExchangeData } from './types';
import { User } from '@/types/users';

const ONBOARDING_EMAIL_RECIPIENT = process.env.FOUNDER_EMAIL || 'nick@crusolabs.com';

export class ExchangeProcessingService {
    private static instance: ExchangeProcessingService | null = null;
    private exchangeDataService: ExchangeDataService;
    private emailParsingService: EmailParsingService;
    private emailService: EmailService;

    private constructor() {
        this.exchangeDataService = ExchangeDataService.getInstance();
        this.emailParsingService = EmailParsingService.getInstance();
        this.emailService = EmailService.getInstance();
    }

    public static getInstance(): ExchangeProcessingService {
        if (!ExchangeProcessingService.instance) {
            ExchangeProcessingService.instance = new ExchangeProcessingService();
        }
        return ExchangeProcessingService.instance;
    }

    // ============================================================================
    // EMAIL PROCESSING METHODS
    // ============================================================================

    /**
     * Process incoming emails and determine if they are new or part of existing threads
     * @param c - The Hono context containing the email data
     * @returns Promise<EmailData> - The processed email data with appropriate threading information
     */
    async processEmail(c: Context): Promise<EmailData> {
        const rawEmailData = await this.emailParsingService.parseEmail(c);

        const previousMessageID = rawEmailData.previousMessageId;
        if (!previousMessageID) {
            return this.newEmailWithoutPriors(rawEmailData);
        }

        // Check if the previous message exists
        const previousMessage = await this.exchangeDataService.getByMessageId(previousMessageID);
        if (!previousMessage) {
            return this.newEmailWithoutPriors(rawEmailData);
        }

        return this.emailWithPriors(rawEmailData, previousMessage);
    }

    /**
     * Create an email without priors
     * @param rawEmailData - The raw email data
     * @returns Promise<EmailData> - The email data with a new id and exchangeId
     */
    private async newEmailWithoutPriors(rawEmailData: RawEmailData): Promise<EmailData> {
        const bodyPrefix = generatePrefixForBody(
            { name: rawEmailData.sender, address: rawEmailData.sender },
            rawEmailData.timestamp,
        );
        const cleanedBody = cleanTextContent(rawEmailData.rawBody, {
            maxLength: 1000,
            trim: true,
            lowercase: false,
            sanitize: true,
            decode: true,
        });
        const emailData: EmailData = {
            ...rawEmailData,
            id: randomUUID(),
            exchangeId: randomUUID(),
            subject: rawEmailData.rawSubject,
            body: bodyPrefix + cleanedBody,
        };
        return emailData;
    }

    /**
     * Create an email with priors
     * @param rawEmailData - The raw email data
     * @param priorEmail - The prior email
     * @returns Promise<EmailData> - The email data with the prior email's exchangeId
     */
    private async emailWithPriors(
        rawEmailData: RawEmailData,
        priorEmail: ExchangeData, // ExchangeData type
    ): Promise<EmailData> {
        const bodyPrefix = generatePrefixForBody(
            { name: rawEmailData.sender, address: rawEmailData.sender },
            rawEmailData.timestamp,
        );
        const cleanedBody = cleanTextContent(rawEmailData.rawBody, {
            maxLength: 1000,
            trim: true,
            lowercase: false,
            sanitize: true,
            decode: true,
        });
        const emailData: EmailData = {
            ...rawEmailData,
            id: randomUUID(),
            exchangeId: priorEmail.exchangeId,
            subject: rawEmailData.rawSubject,
            body: bodyPrefix + cleanedBody,
        };
        return emailData;
    }

    // ============================================================================
    // EXCHANGE HANDLING METHODS
    // ============================================================================

    /**
     * Onboard a user
     * @param emailData - The email data of the onboarding email
     * @returns The email data of the sent onboarding email
     * @description This method is used to onboard a user
     */
    async handleNewUser(inboundEmailData: EmailData) {
        console.log('onboarding non-user', { inboundEmailData });

        const outboundEmailData = await this.emailService.sendEmail({
            recipients: [inboundEmailData.sender],
            cc: [ONBOARDING_EMAIL_RECIPIENT],
            subject: ONBOARDING_EMAIL_SUBJECT,
            body: ONBOARDING_EMAIL_TEMPLATE,
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

        const signature = await this.exchangeDataService.getSignature(inboundEmailData.exchangeId);
        const body = USER_REPLYING_TO_OLDER_EMAIL_TEMPLATE + `\n\n${signature}`;
        const outboundEmailData = await this.emailService.sendReply(inboundEmailData, {
            type: 'sender-only',
            body,
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

        const signature = await this.exchangeDataService.getSignature(inboundEmailData.exchangeId);
        const body = NON_USER_REPLYING_TO_OLDER_EMAIL_TEMPLATE + `\n\n${signature}`;
        const outboundEmailData = await this.emailService.sendReply(inboundEmailData, {
            type: 'sender-only',
            body,
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

        // Look up the previous message to find the exchange owner
        const previousMessage = await this.exchangeDataService.getByMessageId(
            emailData.previousMessageId!,
        );
        if (!previousMessage) {
            throw new Error(
                `No previous message found for message ID: ${emailData.previousMessageId}`,
            );
        }

        // Get the exchange owner from the previous message
        if (!previousMessage.exchangeOwnerId) {
            throw new Error(
                `No exchange owner found for exchange ID: ${previousMessage.exchangeId}`,
            );
        }

        await this.exchangeDataService.saveEmail(emailData, previousMessage.exchangeOwnerId);

        // Determine reply type based on email content
        const replyToMe = emailData.body.includes('reply to me');
        const replyType = replyToMe ? 'sender-only' : 'all-including-sender';

        const signature = await this.exchangeDataService.getSignature(emailData.exchangeId);

        // NOTE: sender-only mode might not be viable for real world use case tbh
        const sentEmail = await this.emailService.sendReply(emailData, {
            type: replyType,
            body: `You have been pinged!

${signature}`,
        });

        console.log('sent engagement email', { sentEmail });

        // Save the sent email to the database
        const savedEmail = await this.exchangeDataService.saveEmail(
            sentEmail,
            previousMessage.exchangeOwnerId,
        );
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
    }
}
