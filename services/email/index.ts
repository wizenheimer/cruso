import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { EmailData } from '../inbox/content';
import { MailgunMessageData } from 'mailgun.js/definitions';
import { v4 as uuidv4 } from 'uuid';

export class EmailService {
    private static instance: EmailService | null = null;
    private mailgun: Mailgun;
    private domain: string;
    private apiKey: string;
    private senderEmail: string;

    private constructor() {
        this.apiKey = process.env.MAILGUN_API_KEY || '';
        this.domain = process.env.MAILGUN_DOMAIN || '';
        this.senderEmail = process.env.MAIN_EMAIL_ADDRESS || 'cruso@crusolabs.com';

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

    /*
     * Helper method to send an email
     * @param recipients - The recipients of the email
     * @param subject - The subject of the email
     * @param body - The body of the email
     * @param previousMessageId - The previous message ID
     * @param parentId - The parent ID
     * @returns The email data of the sent email
     * @description This method is used to send an email to the recipients
     */
    private async sendEmail(
        recipients: string[],
        subject: string,
        body: string,
        previousMessageId?: string,
        parentId?: string,
        cc?: string[],
        bcc?: string[],
    ): Promise<EmailData> {
        // Filter out duplicates and normalize email addresses
        const normalizedRecipients = [
            ...new Set(recipients.map((recipient) => recipient.toLowerCase())),
        ];

        // Filter out email addresses that have our domain name
        const filteredRecipients = normalizedRecipients.filter((recipient) => {
            return !recipient.includes(this.domain);
        });

        console.log('filteredRecipients', filteredRecipients);

        try {
            const mg = this.mailgun.client({
                username: 'api',
                key: this.apiKey,
            });

            const messageData: MailgunMessageData = {
                from: this.senderEmail,
                to: filteredRecipients,
                subject: subject,
                text: body,
                cc: cc,
                bcc: bcc,
                // Only include reply headers if we have a previousMessageId
                ...(previousMessageId && {
                    'h:In-Reply-To': previousMessageId,
                    'h:References': previousMessageId,
                }),
            };

            const response = await mg.messages.create(this.domain, messageData);

            if (response.status !== 200) {
                throw new Error(response.details?.[0] || 'failed to send email');
            }

            if (!response.id) {
                throw new Error('response id is missing from the email response');
            }

            // Create and return EmailData
            const emailData: EmailData = {
                id: uuidv4(), // Generate a new UUID for this email record
                parentId: parentId || uuidv4(), // Use the parentId from the request or generate a new one for the exchange
                messageId: response.id, // Use Mailgun's Message-ID from response
                previousMessageId: previousMessageId || null,
                sender: this.senderEmail,
                recipients: filteredRecipients,
                subject: subject,
                body: body,
                timestamp: new Date(),
                type: 'outbound',
            };

            return emailData;
        } catch (error) {
            console.error('Failed to send email:', error);
            throw new Error(
                `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Helper method to send a reply email in an existing thread
     * @param originalEmail - The original email to reply to
     * @param replyBody - The body of the reply email
     * @param replySubject - The subject of the reply email
     * @returns The email data of the sent email
     * @description This method is used to send a reply email to the original sender only
     */
    async sendReplyToOriginalSender(
        originalEmail: EmailData,
        replyBody: string,
        replySubject?: string,
    ): Promise<EmailData> {
        const subject = replySubject || `Re: ${originalEmail.subject.replace(/^Re:\s*/, '')}`;

        const recipients = [originalEmail.sender]; // Reply to the original sender only

        return this.sendEmail(
            recipients, // Reply to the original sender
            subject,
            replyBody,
            originalEmail.messageId, // Reference the original message
            originalEmail.parentId, // Keep the same thread
        );
    }

    /**
     * Helper method to send a reply email to all recipients
     * @param originalEmail - The original email to reply to
     * @param replyBody - The body of the reply email
     * @param replySubject - The subject of the reply email
     * @returns The email data of the sent email
     * @description This method is used to send a reply email to all recipients of the original email including the original sender
     */
    async sendReplyToAllIncludingSender(
        originalEmail: EmailData,
        replyBody: string,
        replySubject?: string,
    ): Promise<EmailData> {
        const subject = replySubject || `Re: ${originalEmail.subject.replace(/^Re:\s*/, '')}`;
        const recipients = [originalEmail.sender, ...originalEmail.recipients];

        return this.sendEmail(
            recipients, // Reply to the original sender
            subject,
            replyBody,
            originalEmail.messageId, // Reference the original message
            originalEmail.parentId, // Keep the same exchange
        );
    }

    /**
     * Helper method to send a reply email to all recipients except the sender
     * @param originalEmail - The original email to reply to
     * @param replyBody - The body of the reply email
     * @param replySubject - The subject of the reply email
     * @returns The email data of the sent email
     * @description This method is used to send a reply email to all recipients except the sender
     */
    async sendReplyToAllRecipientsExcludingSender(
        originalEmail: EmailData,
        replyBody: string,
        replySubject?: string,
    ): Promise<EmailData> {
        const subject = replySubject || `Re: ${originalEmail.subject.replace(/^Re:\s*/, '')}`;
        // Make a copy of the recipients
        let recipients = [...originalEmail.recipients];
        const sender = originalEmail.sender;

        // Filter out the sender from the recipients
        recipients = recipients.filter((recipient) => recipient !== sender);

        return this.sendEmail(recipients, subject, replyBody);
    }

    /**
     * Helper method to send a reply email to all recipients with a copy to the sender
     * @param originalEmail - The original email to reply to
     * @param replyBody - The body of the reply email
     * @param replySubject - The subject of the reply email
     * @returns The email data of the sent email
     * @description This method is used to send a reply email to all recipients with a carbon copy to the sender
     */
    async sendReplyToAllRecipientsWithCopyToSender(
        originalEmail: EmailData,
        replyBody: string,
        replySubject?: string,
    ): Promise<EmailData> {
        const subject = replySubject || `Re: ${originalEmail.subject.replace(/^Re:\s*/, '')}`;
        // Make a copy of the recipients
        let recipients = [...originalEmail.recipients];
        const sender = originalEmail.sender;

        // Filter out the sender from the recipients
        recipients = recipients.filter((recipient) => recipient !== sender);

        return this.sendEmail(
            recipients,
            subject,
            replyBody,
            originalEmail.messageId,
            originalEmail.parentId,
            [sender],
        );
    }

    /**
     * Helper method to send a reply email to the original sender
     * @param originalEmail - The original email to reply to
     * @param replyBody - The body of the reply email
     * @param replySubject - The subject of the reply email
     * @returns The email data of the sent email
     * @description This method is used to send a reply email to the original sender only
     */
    async sendReplyOnlyToSender(
        originalEmail: EmailData,
        replyBody: string,
        replySubject?: string,
    ): Promise<EmailData> {
        const subject = replySubject || `Re: ${originalEmail.subject.replace(/^Re:\s*/, '')}`;
        const recipients = [originalEmail.sender];

        return this.sendEmail(
            recipients,
            subject,
            replyBody,
            originalEmail.messageId, // Reference the original message
            originalEmail.parentId, // Keep the same exchange
        );
    }

    /**
     * Helper method to forward an email
     */
    async forwardEmail(
        originalEmail: EmailData,
        forwardTo: string[],
        forwardBody?: string,
    ): Promise<EmailData> {
        const subject = `Fwd: ${originalEmail.subject}`;
        const body =
            forwardBody ||
            `
---------- Forwarded message ---------
From: ${originalEmail.sender}
Date: ${originalEmail.timestamp.toLocaleString()}
Subject: ${originalEmail.subject}
To: ${originalEmail.recipients.join(', ')}

${originalEmail.body}`;

        return this.sendEmail(
            forwardTo,
            subject,
            body,
            undefined, // No previous message ID for forwards
            uuidv4(), // New thread for forwarded emails
        );
    }

    /**
     * Helper method to send an email to a new thread
     * @param recipients - The recipients of the email
     * @param subject - The subject of the email
     * @param body - The body of the email
     * @returns The email data of the sent email
     * @description This method is used to send an email to a new thread
     */
    async sendEmailToNewThread(recipients: string[], subject: string, body: string) {
        return this.sendEmail(
            recipients,
            subject,
            body,
            undefined, // No previous message ID for new threads
            uuidv4(), // New thread for new emails
        );
    }
}
