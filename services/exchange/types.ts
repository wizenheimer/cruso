import { z } from 'zod';

// Zod schemas as the single source of truth
export const RawEmailDataSchema = z.object({
    messageId: z.string().min(1, 'Message ID is required'), // MessageID of the email
    previousMessageId: z.string().nullable(), // MessageID of the previous email - null if the email is the first in the exchange
    sender: z.string().email('Invalid sender email address'), // Email address of the sender
    recipients: z
        .array(z.string().email('Invalid recipient email address'))
        .min(1, 'At least one recipient is required'), // Email addresses of the recipients - includes CC and BCC
    rawSubject: z.string(), // Subject of the email
    rawBody: z.string(), // Body of the email
    timestamp: z.date(), // Timestamp of the email
    type: z.enum(['inbound', 'outbound']), // Type of the email - inbound or outbound
});

export const EmailDataSchema = z.object({
    id: z.string().uuid('Invalid email ID format'), // UUID for the email
    exchangeId: z.string().uuid('Invalid exchange ID format'), // UUID for the parent email
    messageId: z.string().min(1, 'Message ID is required'), // MessageID of the email
    previousMessageId: z.string().nullable(), // MessageID of the previous email - null if the email is the first in the exchange
    sender: z.string().email('Invalid sender email address'), // Email address of the sender
    recipients: z
        .array(z.string().email('Invalid recipient email address'))
        .min(1, 'At least one recipient is required'), // Email addresses of the recipients - includes CC and BCC
    subject: z.string(), // Subject of the email - sanitized
    body: z.string(), // Body of the email - sanitized
    timestamp: z.date(), // Timestamp of the email
    type: z.enum(['inbound', 'outbound']), // Type of the email - inbound or outbound
});

// ExchangeData schema for database operations (omits subject and body)
export const ExchangeDataSchema = z.object({
    id: z.string().uuid('Invalid email ID format'), // UUID for the email
    exchangeId: z.string().uuid('Invalid exchange ID format'), // UUID for the parent email
    exchangeOwnerId: z.string(), // User ID who owns this exchange
    messageId: z.string().min(1, 'Message ID is required'), // MessageID of the email
    previousMessageId: z.string().nullable(), // MessageID of the previous email - null if the email is the first in the exchange
    sender: z.string().email('Invalid sender email address'), // Email address of the sender
    recipients: z
        .array(z.string().email('Invalid recipient email address'))
        .min(1, 'At least one recipient is required'), // Email addresses of the recipients - includes CC and BCC
    timestamp: z.date(), // Timestamp of the email
    type: z.enum(['inbound', 'outbound']), // Type of the email - inbound or outbound
    // Note: subject and body are omitted from database storage
    // They are handled by agent memory instead
});

// Helper schemas for partial updates
export const PartialRawEmailDataSchema = RawEmailDataSchema.partial();
export const PartialEmailDataSchema = EmailDataSchema.partial();
export const PartialExchangeDataSchema = ExchangeDataSchema.partial();

// TypeScript types inferred from Zod schemas (single source of truth)
export type RawEmailData = z.infer<typeof RawEmailDataSchema>;
export type EmailData = z.infer<typeof EmailDataSchema>;
export type ExchangeData = z.infer<typeof ExchangeDataSchema>;
export type PartialRawEmailData = z.infer<typeof PartialRawEmailDataSchema>;
export type PartialEmailData = z.infer<typeof PartialEmailDataSchema>;
export type PartialExchangeData = z.infer<typeof PartialExchangeDataSchema>;
