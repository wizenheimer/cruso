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
}
