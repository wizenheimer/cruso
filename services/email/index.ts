import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { EmailData } from '../inbox/content';
import { MailgunMessageData } from 'mailgun.js/definitions';

export class EmailService {
    private static instance: EmailService | null = null;
    private mailgun: Mailgun;
    private domain: string;
    private apiKey: string;

    private constructor() {
        this.apiKey = process.env.MAILGUN_API_KEY || '';
        this.domain = process.env.MAILGUN_DOMAIN || '';

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

    async sendEmail(emailData: EmailData) {
        try {
            const mg = this.mailgun.client({
                username: 'api',
                key: this.apiKey,
            });

            const messageData: MailgunMessageData = {
                from: emailData.sender,
                to: emailData.recipients,
                subject: emailData.subject,
                text: emailData.body,
                'h:Message-ID': emailData.messageID,
                'h:In-Reply-To': emailData.previousMessageID,
                'h:References': emailData.previousMessageID,
            };

            // Add custom metadata as v:<key> fields
            if (emailData.metadata) {
                for (const [key, value] of Object.entries(emailData.metadata)) {
                    messageData[`v:${key}`] = value;
                }
            }

            const response = await mg.messages.create(this.domain, messageData);

            if (response.status !== 200) {
                throw new Error(response.details?.[0] || 'Failed to send email');
            }

            return {
                success: response.status === 200,
                messageId: response.id,
                message: response.message,
            };
        } catch (error) {
            console.error('Failed to send email:', error);
            throw new Error(
                `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
        }
    }
}
