import { EmailData, RawEmailData } from '@/types/exchange';
import { ExchangeDataService } from './data';
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
import { ExchangeData } from '@/types/exchange';
import { User } from '@/types/users';
import { Mastra } from '@mastra/core/mastra';
import { mastra } from '@/mastra';
import { getFirstPartySchedulingAgentRuntimeContext } from '@/mastra/agent/fpscheduling';
import { Agent } from '@mastra/core/agent';
import { getThirdPartySchedulingAgentRuntimeContext } from '@/mastra/agent/tpscheduling';
import { getUserById } from '@/db/queries/users';
import { formatEmailText } from '@/mastra/agent/formatter';

const ONBOARDING_EMAIL_RECIPIENT = process.env.FOUNDER_EMAIL || 'nick@crusolabs.com';

export class ExchangeProcessingService {
    private static instance: ExchangeProcessingService | null = null;
    private exchangeDataService: ExchangeDataService;
    private emailParsingService: EmailParsingService;
    private emailService: EmailService;
    private mastra: Mastra;

    private constructor() {
        this.exchangeDataService = ExchangeDataService.getInstance();
        this.emailParsingService = EmailParsingService.getInstance();
        this.emailService = EmailService.getInstance();
        this.mastra = mastra;
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
        const outboundEmailData = await this.emailService.sendEmail({
            recipients: [inboundEmailData.sender],
            cc: [ONBOARDING_EMAIL_RECIPIENT],
            subject: ONBOARDING_EMAIL_SUBJECT,
            body: ONBOARDING_EMAIL_TEMPLATE,
            newThread: true, // Force new thread for onboarding
        });

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
     * Handle engagement for non-user
     * @param emailData - The email data of the email
     * @returns The email data of the sent email
     * @description This method handles non-user exchanges - triggered when Cruso acts on behalf of a user
     */
    async handleEngagementForNonUser(emailData: EmailData) {
        // Check if the previous message exists
        if (!emailData.previousMessageId) {
            console.error('No previous message ID found');
            return this.handleInvalidEngagementForNonUser(emailData);
        }

        // Look up the previous message to find the exchange owner
        const previousMessage = await this.exchangeDataService.getByMessageId(
            emailData.previousMessageId,
        );
        if (!previousMessage) {
            console.error(
                `No previous message found for message ID: ${emailData.previousMessageId}`,
            );
            return this.handleInvalidEngagementForNonUser(emailData);
        }

        // Get the exchange owner from the previous message
        if (!previousMessage.exchangeOwnerId) {
            console.error(`No exchange owner found for exchange ID: ${previousMessage.exchangeId}`);
            return this.handleInvalidEngagementForNonUser(emailData);
        }

        // Merge the previous message receipts with the current message
        const previousMessageReceipts = previousMessage.recipients;
        const currentMessageReceipts = emailData.recipients;
        let mergedReceipts = [...new Set([...previousMessageReceipts, ...currentMessageReceipts])];

        // Remove the sender and any @crusolabs.com emails from the merged receipts
        mergedReceipts = mergedReceipts.filter(
            (recipient) => recipient !== emailData.sender && !recipient.includes('@crusolabs.com'),
        );

        // Update the email data with the merged receipts
        emailData.recipients = mergedReceipts;

        // Save the current email to the database
        const exchangeData = await this.exchangeDataService.saveEmail(
            emailData,
            previousMessage.exchangeOwnerId,
        );

        // Get the user from the previous message
        const user = await getUserById(previousMessage.exchangeOwnerId);
        if (!user) {
            console.error(`User not found for ID: ${previousMessage.exchangeOwnerId}`);
            return this.handleInvalidEngagementForNonUser(emailData);
        }

        // Get the agent
        const agent = await this.getAgent('thirdParty');

        // Prepare the runtime context
        const runtimeContext = await this.getRuntimeContext(
            'thirdParty',
            user,
            emailData,
            exchangeData,
        );

        // Generate the response
        const result = await agent.generate(emailData.body, {
            maxSteps: 10, // Allow up to 10 tool usage steps
            resourceId: previousMessage.exchangeOwnerId,
            threadId: emailData.exchangeId,
            runtimeContext,
        });

        // Get the signature and add it to the response
        const signature = await this.exchangeDataService.getSignature(emailData.exchangeId);

        const formattedBody = await formatEmailText(result.text + `\n${signature}`);

        // Send the reply
        const sentEmail = await this.emailService.sendReply(emailData, {
            type: 'all-including-sender',
            body: formattedBody.content,
            bodyHTML: formattedBody.success ? formattedBody.content : undefined,
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
        // Check if the previous message exists
        if (emailData.previousMessageId) {
            const previousMessage = await this.exchangeDataService.getByMessageId(
                emailData.previousMessageId,
            );

            if (previousMessage) {
                console.log('found a previous message, merging receipts', previousMessage);

                // Merge the previous message receipts with the current message
                const previousMessageReceipts = previousMessage.recipients;
                const currentMessageReceipts = emailData.recipients;
                let mergedReceipts = [
                    ...new Set([...previousMessageReceipts, ...currentMessageReceipts]),
                ];

                // Remove the sender and any @crusolabs.com emails from the merged receipts
                mergedReceipts = mergedReceipts.filter(
                    (recipient) =>
                        recipient !== emailData.sender && !recipient.includes('@crusolabs.com'),
                );

                console.log('merged receipts', mergedReceipts);
                // Update the email data with the merged receipts
                emailData.recipients = mergedReceipts;
            }
        }

        // Save the email to the database
        const exchangeData = await this.exchangeDataService.saveEmail(emailData, user.id);

        // Get the agent
        const agent = await this.getAgent('firstParty');

        // Prepare the runtime context
        const runtimeContext = await this.getRuntimeContext(
            'firstParty',
            user,
            emailData,
            exchangeData,
        );

        // Generate the response
        const result = await agent.generate(emailData.body, {
            maxSteps: 10, // Allow up to 10 tool usage steps
            resourceId: user.id,
            threadId: emailData.exchangeId,
            runtimeContext,
        });

        // Get the signature and add it to the response
        const signature = await this.exchangeDataService.getSignature(emailData.exchangeId);
        const body = result.text.trim() + `\n${signature}`;

        // Prepare a formatted html response for the email
        const formattedBody = await formatEmailText(result.text + `\n${signature}`);

        console.log('formattedBody', formattedBody);

        // Send the reply
        const sentEmail = await this.emailService.sendReply(emailData, {
            type: 'all-including-sender',
            body: body,
            bodyHTML: formattedBody.success ? formattedBody.content : undefined,
        });

        // Save the sent email to the database
        await this.exchangeDataService.saveEmail(sentEmail, user.id);

        return sentEmail;
    }

    private async getAgent(userType: 'firstParty' | 'thirdParty') {
        let agent: Agent;
        if (userType === 'firstParty') {
            agent = await this.mastra.getAgent('firstPartySchedulingAgent');
        } else {
            agent = await this.mastra.getAgent('thirdPartySchedulingAgent');
        }
        return agent;
    }

    private async getRuntimeContext(
        userType: 'firstParty' | 'thirdParty',
        user: User,
        emailData: EmailData,
        exchangeData: ExchangeData,
    ) {
        if (userType === 'firstParty') {
            return await getFirstPartySchedulingAgentRuntimeContext(user, emailData, exchangeData);
        } else {
            return await getThirdPartySchedulingAgentRuntimeContext(user, emailData, exchangeData);
        }
    }
}
