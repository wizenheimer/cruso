import { Context } from 'hono';
import {
    parseInboundWebhookWithAttachments,
    parseInboundWebhookWithoutAttachments,
} from '@/services/exchange/parsing/inbound';
import { RawEmailData } from '@/services/exchange/types';

/**
 * EmailParsingService class for parsing emails from inbound webhooks
 *
 * @description This class is used to parse emails from the inbound webhook.
 * It supports multipart data.
 * It supports application/json for outbound webhook.
 * It supports application/x-www-form-urlencoded for inbound webhook without attachments.
 * It supports multipart/form-data for inbound webhook with attachments.
 * It supports application/json for outbound webhook.
 *
 * @example
 * ```typescript
 * const parser = EmailParsingService.getInstance();
 * const emailData = await parser.parseEmail(context);
 * ```
 */
export class EmailParsingService {
    private static instance: EmailParsingService | null = null;

    private constructor() {}

    /**
     * Gets the singleton instance of EmailParsingService
     *
     * @returns {EmailParsingService} The singleton instance
     */
    public static getInstance(): EmailParsingService {
        if (!EmailParsingService.instance) {
            EmailParsingService.instance = new EmailParsingService();
        }
        return EmailParsingService.instance;
    }

    /**
     * Parse an email from the inbound webhook and return the raw email data
     *
     * @param {Context} c - The Hono context of the request containing headers and body
     * @returns {Promise<RawEmailData>} The parsed email data
     * @throws {Error} When content type is not supported or outbound webhook is attempted
     *
     * @description This method handles different content types:
     * - multipart/form-data: Inbound email webhook with attachments
     * - application/x-www-form-urlencoded: Inbound email webhook without attachments
     * - application/json: Outbound email webhook (currently not supported)
     *
     * The method also checks if the body content is actually multipart data even if the
     * content-type header doesn't indicate it.
     */
    async parseEmail(c: Context): Promise<RawEmailData> {
        const contentType = c.req.header('content-type') || '';

        // Check if it's actually multipart data even if content-type doesn't say so
        const body = await c.req.text();
        const isMultipart =
            body.startsWith('--') && body.includes('Content-Disposition: form-data');

        let emailData: RawEmailData;
        if (contentType.includes('multipart/form-data') || isMultipart) {
            // Inbound email webhook with attachments (or multipart data)
            emailData = await parseInboundWebhookWithAttachments(body);
        } else if (contentType.includes('application/json')) {
            // Outbound email webhook
            console.log('outbound webhook not supported');
            throw new Error('outbound webhook not supported');
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            // Inbound email webhook without attachments
            emailData = await parseInboundWebhookWithoutAttachments(body);
        } else {
            console.log('unsupported content type for inbound webhook', contentType);
            throw new Error('Unsupported content type');
        }

        return emailData;
    }
}
