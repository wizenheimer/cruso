import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { EmailService } from '@/services/email';
import { v4 as uuidv4 } from 'uuid';

const emailRouter = new Hono();

// Schema for sending emails
const sendEmailSchema = z.object({
    sender: z.string().email(),
    recipients: z.array(z.string().email()).min(1),
    subject: z.string().min(1).max(100),
    body: z.string().min(1).max(1000),
    replyToMessageId: z.string().optional(), // For threading
    metadata: z.record(z.string(), z.string()).optional(), // Add metadata
});

// POST /api/email/send - Send an email
emailRouter.post('/send', zValidator('json', sendEmailSchema), async (c) => {
    try {
        const body = await c.req.json();
        const emailService = EmailService.getInstance();

        // Create EmailData object
        const emailData = {
            id: uuidv4(),
            parentID: uuidv4(), // You might want to derive this from replyToMessageId
            messageID: `<${uuidv4()}@${process.env.MAILGUN_DOMAIN}>`,
            previousMessageID:
                body.replyToMessageId || `<${uuidv4()}@${process.env.MAILGUN_DOMAIN}>`,
            sender: body.sender,
            recipients: body.recipients,
            subject: body.subject,
            body: body.body,
            timestamp: Date.now(),
            metadata: body.metadata || {}, // Pass metadata
        };

        const result = await emailService.sendEmail(emailData);

        return c.json({
            success: true,
            messageId: result.messageId,
            message: result.message,
        });
    } catch (error) {
        console.error('Failed to send email:', error);
        return c.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            500,
        );
    }
});

export default emailRouter;
