import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { EmailData } from '@/types/exchange';
import { MailgunMessageData } from 'mailgun.js/definitions';
import { randomUUID } from 'crypto';
import {
    SendEmailConfig,
    ReplyConfig,
    EmailSendParams,
    ReplyRecipients,
    ThreadContext,
} from '@/types/email';

export class EmailService {
    private static instance: EmailService | null = null;
    private mailgun: Mailgun;
    private domain: string;
    private apiKey: string;
    private senderEmail: string;

    private constructor() {
        this.apiKey = process.env.MAILGUN_API_KEY || '';
        this.domain = process.env.MAILGUN_DOMAIN || '';
        this.senderEmail = process.env.MAIN_EMAIL_ADDRESS || 'cruso@cruso.app';

        if (!this.apiKey || !this.domain) {
            throw new Error(
                'MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables are required',
            );
        }

        this.mailgun = new Mailgun(formData);
    }

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    /**
     * @param config - The configuration for the email
     * @returns The email data of the sent email
     * @description This method is used to send an email with flexible configuration
     */
    async sendEmail(config: SendEmailConfig): Promise<EmailData> {
        const {
            recipients,
            subject,
            body,
            bodyHTML,
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
            bodyHTML,
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
        const { type, body, subject, bodyHTML } = replyConfig;
        const replySubject = subject || `Re: ${originalEmail.subject.replace(/^Re:\s*/, '')}`;

        const recipients = this.getReplyRecipients(originalEmail, type);

        console.log('recipients', recipients);
        console.log('body', body);
        console.log('bodyHTML', bodyHTML);

        return this.sendEmail({
            recipients: recipients.to,
            cc: recipients.cc,
            subject: replySubject,
            body,
            bodyHTML,
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
    private getThreadContext(replyTo?: EmailData, newThread?: boolean): ThreadContext {
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
    private getReplyRecipients(
        originalEmail: EmailData,
        type: ReplyConfig['type'],
    ): ReplyRecipients {
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
    private async executeEmailSend(params: EmailSendParams): Promise<EmailData> {
        const { to, cc, bcc, subject, body, bodyHTML, exchangeId, previousMessageId } = params;

        try {
            const mg = this.mailgun.client({
                username: 'api',
                key: this.apiKey,
            });

            let messageData: MailgunMessageData;

            if (bodyHTML) {
                console.log('sending email with html');
                messageData = {
                    from: `Cruso <${this.senderEmail}>`,
                    to,
                    subject,
                    html: bodyHTML,
                    ...(cc.length > 0 && { cc }),
                    ...(bcc.length > 0 && { bcc }),
                    ...(previousMessageId && {
                        'h:In-Reply-To': previousMessageId,
                        'h:References': previousMessageId,
                    }),
                };
            } else {
                console.log('sending email with plain text');
                messageData = {
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
            }

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
                timestamp: Date.now(), // Unix timestamp in milliseconds
                type: 'outbound',
            };
        } catch (error) {
            // If HTML failed and we have plain text, try with plain text
            if (bodyHTML && body) {
                console.error('email dispatch failed, attempting with plain text');
                try {
                    const mg = this.mailgun.client({
                        username: 'api',
                        key: this.apiKey,
                    });

                    const textMessageData = {
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

                    const response = await mg.messages.create(this.domain, textMessageData);

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
                        timestamp: Date.now(), // Unix timestamp in milliseconds
                        type: 'outbound',
                    };
                } catch (textError) {
                    throw error; // Throw original HTML error
                }
            }

            console.error('Failed to send email:', error);
            throw new Error(
                `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}
