import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { EmailData } from '../exchange/types';
import { MailgunMessageData } from 'mailgun.js/definitions';
import { randomUUID } from 'crypto';

// Configuration interface for sending emails
interface SendEmailConfig {
    recipients: string[];
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
    replyTo?: EmailData; // If replying to an email
    newThread?: boolean; // Force new thread (default: true if no replyTo)
}

// Reply configuration for different reply behaviors
interface ReplyConfig {
    type: 'sender-only' | 'all-including-sender' | 'all-excluding-sender' | 'all-with-cc-to-sender';
    body: string;
    subject?: string;
}

export class EmailService {
    private static instance: EmailService | null = null;
    private mailgun: Mailgun;
    private domain: string;
    private apiKey: string;
    private senderEmail: string;

    private constructor() {
        console.log('┌─ [EMAIL_SERVICE] Initializing email service...');
        this.apiKey = process.env.MAILGUN_API_KEY || '';
        this.domain = process.env.MAILGUN_DOMAIN || '';
        this.senderEmail = process.env.MAIN_EMAIL_ADDRESS || 'cruso@crusolabs.com';

        console.log('├─ [EMAIL_SERVICE] Configuration:', {
            hasDomain: !!this.domain,
            hasApiKey: !!this.apiKey,
            senderEmail: this.senderEmail,
        });

        if (!this.apiKey || !this.domain) {
            console.log('└─ [EMAIL_SERVICE] Missing required environment variables');
            throw new Error(
                'MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables are required',
            );
        }

        this.mailgun = new Mailgun(formData);
        console.log('└─ [EMAIL_SERVICE] Email service initialized successfully');
    }

    public static getInstance(): EmailService {
        console.log('┌─ [EMAIL_SERVICE] Getting email service instance...');
        if (!EmailService.instance) {
            console.log('├─ [EMAIL_SERVICE] Creating new instance...');
            EmailService.instance = new EmailService();
        } else {
            console.log('├─ [EMAIL_SERVICE] Using existing instance...');
        }
        console.log('└─ [EMAIL_SERVICE] Instance retrieved');
        return EmailService.instance;
    }

    /**
     * @param config - The configuration for the email
     * @returns The email data of the sent email
     * @description This method is used to send an email with flexible configuration
     */
    async sendEmail(config: SendEmailConfig): Promise<EmailData> {
        console.log('┌─ [EMAIL_SERVICE] Sending email...', {
            recipients: config.recipients.length,
            subject: config.subject,
            hasReplyTo: !!config.replyTo,
        });

        const {
            recipients,
            subject,
            body,
            cc = [],
            bcc = [],
            replyTo,
            newThread = !replyTo,
        } = config;

        // Determine thread context
        const threadContext = this.getThreadContext(replyTo, newThread);

        // Process recipients
        const processedRecipients = this.processRecipients(recipients);
        const processedCC = this.processRecipients(cc);
        const processedBCC = this.processRecipients(bcc);

        // Send the email
        return this.executeEmailSend({
            to: processedRecipients,
            cc: processedCC,
            bcc: processedBCC,
            subject,
            body,
            ...threadContext,
        });
    }

    /**
     * Send a reply to an email
     * @param originalEmail - The original email to reply to
     * @param replyConfig - The configuration for the reply
     * @returns The email data of the sent email
     * @description This method is used to send a reply to an email with different reply behaviors
     */
    async sendReply(originalEmail: EmailData, replyConfig: ReplyConfig): Promise<EmailData> {
        const { type, body, subject } = replyConfig;
        const replySubject = subject || `Re: ${originalEmail.subject.replace(/^Re:\s*/, '')}`;

        const recipients = this.getReplyRecipients(originalEmail, type);

        return this.sendEmail({
            recipients: recipients.to,
            cc: recipients.cc,
            subject: replySubject,
            body,
            replyTo: originalEmail,
        });
    }

    /**
     * Get the thread context for an email
     * @param replyTo - The email to reply to
     * @param newThread - Whether to create a new thread
     * @returns The thread context
     * @description This method is used to get the thread context for an email
     */
    private getThreadContext(replyTo?: EmailData, newThread?: boolean) {
        if (newThread || !replyTo) {
            return {
                exchangeId: randomUUID(),
                previousMessageId: null,
            };
        }

        return {
            exchangeId: replyTo.exchangeId,
            previousMessageId: replyTo.messageId,
        };
    }

    /**
     * Get the recipients for a reply
     * @param originalEmail - The original email to reply to
     * @param type - The type of reply
     * @returns The recipients for the reply
     * @description This method is used to get the recipients for a reply
     */
    private getReplyRecipients(originalEmail: EmailData, type: ReplyConfig['type']) {
        const sender = originalEmail.sender;
        const allRecipients = originalEmail.recipients;

        switch (type) {
            case 'sender-only':
                return { to: [sender], cc: [] };

            case 'all-including-sender':
                return { to: [sender, ...allRecipients], cc: [] };

            case 'all-excluding-sender':
                return { to: allRecipients.filter((r) => r !== sender), cc: [] };

            case 'all-with-cc-to-sender':
                return {
                    to: allRecipients.filter((r) => r !== sender),
                    cc: [sender],
                };

            default:
                return { to: [sender], cc: [] };
        }
    }

    /**
     * Process recipients
     * @param recipients - The recipients to process
     * @returns The processed recipients
     * @description This method is used to process recipients
     */
    private processRecipients(recipients: string[]): string[] {
        return [...new Set(recipients.map((r) => r.toLowerCase()))].filter(
            (recipient) => !recipient.includes(this.domain),
        );
    }

    /**
     * Execute the email send
     * @param params - The parameters for the email send
     * @returns The email data of the sent email
     * @description This method is used to execute the email send
     */
    private async executeEmailSend(params: {
        to: string[];
        cc: string[];
        bcc: string[];
        subject: string;
        body: string;
        exchangeId: string;
        previousMessageId: string | null;
    }): Promise<EmailData> {
        const { to, cc, bcc, subject, body, exchangeId, previousMessageId } = params;

        try {
            const mg = this.mailgun.client({
                username: 'api',
                key: this.apiKey,
            });

            const messageData: MailgunMessageData = {
                from: `Cruso <${this.senderEmail}>`,
                to,
                subject,
                text: body,
                ...(cc.length > 0 && { cc }),
                ...(bcc.length > 0 && { bcc }),
                ...(previousMessageId && {
                    'h:In-Reply-To': previousMessageId,
                    'h:References': previousMessageId,
                }),
            };

            const response = await mg.messages.create(this.domain, messageData);

            if (response.status !== 200) {
                throw new Error(response.details?.[0] || 'Failed to send email');
            }

            if (!response.id) {
                throw new Error('Response ID is missing from the email response');
            }

            return {
                id: randomUUID(),
                exchangeId,
                messageId: response.id,
                previousMessageId,
                sender: this.senderEmail,
                recipients: [...to, ...cc, ...bcc],
                subject,
                body,
                timestamp: new Date(),
                type: 'outbound',
            };
        } catch (error) {
            console.error('Failed to send email:', error);
            throw new Error(
                `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}
