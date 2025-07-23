import { z } from 'zod';

// Email Configuration Schema
export const SendEmailConfigSchema = z.object({
    recipients: z.array(z.string().email()),
    subject: z.string(),
    body: z.string(),
    cc: z.array(z.string().email()).optional(),
    bcc: z.array(z.string().email()).optional(),
    replyTo: z.any().optional(), // EmailData type - will need to be defined if available
    newThread: z.boolean().optional(), // Force new thread (default: true if no replyTo)
});

// Reply Configuration Schema
export const ReplyConfigSchema = z.object({
    type: z.enum([
        'sender-only',
        'all-including-sender',
        'all-excluding-sender',
        'all-with-cc-to-sender',
    ]),
    body: z.string(),
    subject: z.string().optional(),
});

// Email Send Parameters Schema
export const EmailSendParamsSchema = z.object({
    to: z.array(z.string().email()),
    cc: z.array(z.string().email()),
    bcc: z.array(z.string().email()),
    subject: z.string(),
    body: z.string(),
    exchangeId: z.string(),
    previousMessageId: z.string().nullable(),
});

// Reply Recipients Schema
export const ReplyRecipientsSchema = z.object({
    to: z.array(z.string().email()),
    cc: z.array(z.string().email()),
});

// Thread Context Schema
export const ThreadContextSchema = z.object({
    exchangeId: z.string(),
    previousMessageId: z.string().nullable(),
});
