import { EmailData, RawEmailData } from '@/types/exchange';
import { ExchangeDataService } from './data';
import { EmailParsingService } from './parsing';
import { EmailService } from '../email';
import { Context } from 'hono';
import { randomUUID } from 'crypto';
import { cleanTextContent, generatePrefixForBody } from './parsing/text';
import {
    ONBOARDING_EMAIL_TEMPLATE,
    USER_REPLYING_TO_OLDER_EMAIL_TEMPLATE,
    NON_USER_REPLYING_TO_OLDER_EMAIL_TEMPLATE,
    ONBOARDING_EMAIL_REPLY_TEMPLATE,
    getRandomOnboardingSubject,
} from '@/constants/email';
import { ExchangeData } from '@/types/exchange';
import { User } from '@/types/users';
import { getUserById } from '@/db/queries/users';

const ONBOARDING_EMAIL_RECIPIENT = process.env.FOUNDER_EMAIL || 'nick@crusolabs.com';

export class ExchangeProcessingService {
    private static instance: ExchangeProcessingService | null = null;
    private exchangeDataService: ExchangeDataService;
    private emailParsingService: EmailParsingService;
    private emailService: EmailService;
    private flowHandlers?: FlowHandlers; // Injected by the ExchangeService for flow handling

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

    public setFlowHandlers(handlers: FlowHandlers) {
        this.flowHandlers = handlers;
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
        return this.handleOnboardingFlowForNonUser(inboundEmailData);
    }

    /**
     * Handle invalid engagement for existing user
     * @param emailData - The email data of the offboarding email
     * @param user - The user
     * @returns The email data of the sent email
     * @description This method is used when existing user tries to create branches from old threads
     */
    async handleInvalidEngagementForExistingUser(inboundEmailData: EmailData, user: User) {
        const signature = await this.exchangeDataService.getSignature(inboundEmailData.exchangeId);
        const body = USER_REPLYING_TO_OLDER_EMAIL_TEMPLATE + `\n\n${signature}`;
        const outboundEmailData = await this.emailService.sendReply(inboundEmailData, {
            type: 'sender-only',
            body,
        });

        return outboundEmailData;
    }

    /**
     * Handle invalid engagement for non-user
     * @param emailData - The email data of the email
     * @returns The email data of the sent email
     * @description This method is used when non-user tries to create branches from old threads
     */
    async handleInvalidEngagementForNonUser(inboundEmailData: EmailData) {
        const signature = await this.exchangeDataService.getSignature(inboundEmailData.exchangeId);
        const body = NON_USER_REPLYING_TO_OLDER_EMAIL_TEMPLATE + `\n\n${signature}`;
        const outboundEmailData = await this.emailService.sendReply(inboundEmailData, {
            type: 'sender-only',
            body,
        });

        return outboundEmailData;
    }

    /**
     * Handle onboarding flow for non-user
     * @param emailData - The email data of the email
     * @returns The email data of the sent email
     * @description This method handles onboarding for non-users
     */
    async handleOnboardingFlowForNonUser(emailData: EmailData) {
        // First send a reply to the user
        await this.emailService.sendReply(emailData, {
            type: 'sender-only',
            body: ONBOARDING_EMAIL_REPLY_TEMPLATE,
        });

        // Then send the onboarding email
        await this.emailService.sendEmail({
            recipients: [emailData.sender],
            cc: [ONBOARDING_EMAIL_RECIPIENT],
            subject: getRandomOnboardingSubject(), // Random subject to prevent threading
            body: ONBOARDING_EMAIL_TEMPLATE,
            newThread: true, // Force new thread for onboarding
        });
    }

    /**
     * Handle engagement for non-user
     * @param emailData - The email data of the email
     * @returns The email data of the sent email
     * @description This method handles non-user exchanges - triggered when Cruso acts on behalf of a user
     */
    async handleEngagementForNonUser(emailData: EmailData) {
        // Check if the flow handlers are initialized
        if (!this.flowHandlers) {
            throw new Error('Flow handlers not initialized. Call setFlowHandlers first.');
        }

        // Check if the previous message exists
        if (!emailData.previousMessageId) {
            return this.handleOnboardingFlowForNonUser(emailData);
        }

        // Look up the previous message to find the exchange owner
        const previousMessage = await this.exchangeDataService.getByMessageId(
            emailData.previousMessageId,
        );
        if (!previousMessage) {
            return this.handleOnboardingFlowForNonUser(emailData);
        }

        // Get the exchange owner from the previous message
        if (!previousMessage.exchangeOwnerId) {
            return this.handleOnboardingFlowForNonUser(emailData);
        }

        // Get the user from the previous message
        const user = await getUserById(previousMessage.exchangeOwnerId);
        if (!user) {
            return this.handleOnboardingFlowForNonUser(emailData);
        }

        // Get the receipts for the email
        emailData.recipients = this.getReceiptsForEmail(previousMessage, emailData);

        // Save the current email to the database
        const exchangeData = await this.exchangeDataService.saveEmail(
            emailData,
            previousMessage.exchangeOwnerId,
        );

        // Get the signature and add it to the response
        const signature = await this.exchangeDataService.getSignature(emailData.exchangeId);

        const result = await this.flowHandlers?.handleThirdPartyFlow(
            emailData,
            signature,
            exchangeData,
        );

        // Send the reply
        const sentEmail = await this.emailService.sendReply(emailData, {
            type: 'all-including-sender',
            body: result.content,
            bodyHTML: result.success ? result.content : undefined,
        });

        // Save the sent email to the database
        await this.exchangeDataService.saveEmail(sentEmail, previousMessage.exchangeOwnerId);

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
        if (!this.flowHandlers) {
            throw new Error('Flow handlers not initialized. Call setFlowHandlers first.');
        }

        // Check if the previous message exists
        if (emailData.previousMessageId) {
            const previousExchangeData = await this.exchangeDataService.getByMessageId(
                emailData.previousMessageId,
            );

            if (previousExchangeData) {
                emailData.recipients = this.getReceiptsForEmail(previousExchangeData, emailData);
            }
        }

        // Save the email to the database
        const exchangeData = await this.exchangeDataService.saveEmail(emailData, user.id);

        const signature = await this.exchangeDataService.getSignature(emailData.exchangeId);

        const result = await this.flowHandlers?.handleFirstPartyFlow(
            user,
            signature,
            emailData,
            exchangeData,
        );

        // Send the reply
        const sentEmail = await this.emailService.sendReply(emailData, {
            type: 'all-including-sender',
            body: result.content,
            bodyHTML: result.success ? result.content : undefined,
        });

        // Save the sent email to the database
        await this.exchangeDataService.saveEmail(sentEmail, user.id);

        return sentEmail;
    }

    /**
     * Get the receipts for an email
     * @param previousExchangeData - The previous exchange data
     * @param currentEmailData - The current email data
     * @returns The merged receipts
     */
    private getReceiptsForEmail(previousExchangeData: ExchangeData, currentEmailData: EmailData) {
        const previousMessageReceipts = previousExchangeData.recipients;
        const currentMessageReceipts = currentEmailData.recipients;
        let mergedReceipts = [...new Set([...previousMessageReceipts, ...currentMessageReceipts])];

        // Remove the sender and any @crusolabs.com emails from the merged receipts
        mergedReceipts = mergedReceipts.filter(
            (recipient) =>
                recipient !== currentEmailData.sender && !recipient.includes('@crusolabs.com'),
        );

        return mergedReceipts;
    }

    async createNewExchangeOnBehalfOfUser(
        exchangeOwnerId: string,
        subject: string,
        body: string,
        recipients: string[],
        signature?: string,
    ) {
        // Get the user from the exchange owner id
        const user = await getUserById(exchangeOwnerId);
        if (!user) {
            throw new Error('User not found');
        }

        // Get the signature for the exchange owner
        const formattedSignature =
            signature ||
            (await this.exchangeDataService.getSignatureForExchangeOwner(exchangeOwnerId));

        const userEmail = user.email;

        // Remove any @crusolabs.com emails from the recipients and user email from the recipients
        recipients = recipients.filter((recipient) => !recipient.includes('@crusolabs.com'));
        recipients = recipients.filter((recipient) => recipient !== userEmail);

        // Formatted body with signature
        const formattedBody = body + `\n\n${formattedSignature}`;

        // Create a new thread
        const sentEmail = await this.emailService.sendEmail({
            recipients: recipients,
            cc: [userEmail],
            subject: subject,
            body: formattedBody,
            newThread: true, // Force new thread for onboarding
        });

        // Save the sent email to the database
        const savedEmail = await this.exchangeDataService.saveEmail(sentEmail, exchangeOwnerId);

        return savedEmail;
    }
}

export interface FlowHandlers {
    handleFirstPartyFlow: (
        user: User,
        signature: string,
        emailData: EmailData,
        exchangeData: ExchangeData,
    ) => Promise<any>;
    handleThirdPartyFlow: (
        emailData: EmailData,
        signature: string,
        exchangeData: ExchangeData,
    ) => Promise<any>;
}
