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
                'h:Message-ID': emailData.messageId,
                'h:In-Reply-To': emailData.previousMessageId || '',
                'h:References': emailData.previousMessageId || '',
            };

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

    // replyToEmail function for replying to an email
    async replyToEmail(emailData: EmailData, subject: string, reply: string) {
        // Recepients would be the To
        console.log('replying to email', { emailData, subject, reply });

        // Sender would be CC

        // Recepients would be the To

        // Subject would be the subject

        // Body would be the reply

        // Timestamp would be the current time

        // Type would be outbound
    }
}
