import { Context } from 'hono';
import {
    parseInboundWebhookWithAttachments,
    parseInboundWebhookWithoutAttachments,
} from './inbound';
import { EmailData } from './content';

export class InboxService {
    private static instance: InboxService | null = null;

    private constructor() {}

    public static getInstance(): InboxService {
        if (!InboxService.instance) {
            InboxService.instance = new InboxService();
        }
        return InboxService.instance;
    }

    // parseInboundWebhook parses the inbound webhook and returns the parsed data
    // It supports multipart data.
    async parseInboundWebhook(c: Context): Promise<EmailData> {
        const contentType = c.req.header('content-type') || '';

        // Check if it's actually multipart data even if content-type doesn't say so
        const body = await c.req.text();
        const isMultipart =
            body.startsWith('--') && body.includes('Content-Disposition: form-data');

        if (contentType.includes('multipart/form-data') || isMultipart) {
            // Inbound email webhook with attachments (or multipart data)
            return await parseInboundWebhookWithAttachments(c, body);
        } else if (contentType.includes('application/json')) {
            // Outbound email webhook
            throw new Error('outbound webhook not supported');
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            // Inbound email webhook without attachments
            return await parseInboundWebhookWithoutAttachments(c, body);
        } else {
            throw new Error('Unsupported content type');
        }
    }

    // exchangeExists function for checking if the exchange exists
    // - it checks if the exchange exists
    async exchangeExists(parentID: string): Promise<boolean> {
        return true; // TODO: implement this
    }

    // messageExistsInExchange function for checking if the message exists in the exchange
    // - it checks if the message exists in the exchange
    async messageExistsInExchange(messageID: string, parentID: string): Promise<boolean> {
        return true; // TODO: implement this
    }

    // getLatestMessageInExchange function for getting the latest message in the exchange
    // - it returns the latest message in the exchange
    async getLatestMessageInExchange(parentID: string): Promise<EmailData | null> {
        return {} as EmailData; // TODO: implement this
    }

    // isFirstMessageInExchange function for checking if the email is the first message in the exchange
    // - it checks if the exchange exists and if the previous message exists
    async isFirstMessageInExchange(emailData: EmailData): Promise<boolean> {
        const previousMessageExists = await this.messageExistsInExchange(
            emailData.previousMessageID,
            emailData.parentID,
        );
        return !previousMessageExists;
    }

    // canBranchExchange function for checking if the email can branch the exchange
    // - it checks if previous message ID matches the latest message ID
    async canBranchExchange(emailData: EmailData): Promise<boolean> {
        // Get the latest message in the exchange
        const latestMessage = await this.getLatestMessageInExchange(emailData.parentID);
        if (!latestMessage) {
            return true;
        }

        // Enable engagement if the latest message is the previous message
        return latestMessage.messageID === emailData.previousMessageID;
    }
}
