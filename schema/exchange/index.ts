import { z } from 'zod';

// Email Data Schemas - for email processing and exchange management
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

// API schemas - manual but referencing DB constraints to prevent drift
// NOTE: Keep these in sync with the exchangeData table definition above

// CreateExchangeDataSchema is the schema for creating a new exchange data
export const CreateExchangeDataSchema = z.object({
    id: z.string().uuid(),
    exchangeId: z.string().uuid(),
    exchangeOwnerId: z.string(), // User ID who owns this exchange
    messageId: z.string().max(500), // Matches varchar(500) in DB
    previousMessageId: z.string().max(500).nullable(), // Previous message ID is nullable for first message in exchange
    sender: z.string().max(255), // Matches varchar(255) in DB
    recipients: z.array(z.string().email()).min(1), // Custom validation for email array
    timestamp: z
        .string()
        .datetime()
        .or(z.date())
        .transform((val) => (val instanceof Date ? val : new Date(val))),
    type: z.enum(['inbound', 'outbound']),
});

// UpdateExchangeDataSchema is the schema for updating an existing exchange data
export const UpdateExchangeDataSchema = z.object({
    exchangeId: z.string().uuid(),
    exchangeOwnerId: z.string().optional(), // User ID who owns this exchange
    previousMessageId: z.string().max(500).nullable().optional(), // Previous message ID is nullable for first message in exchange
    sender: z.string().max(255).optional(),
    recipients: z.array(z.string().email()).min(1).optional(),
    timestamp: z
        .string()
        .datetime()
        .or(z.date())
        .transform((val) => (val instanceof Date ? val : new Date(val)))
        .optional(),
    type: z.enum(['inbound', 'outbound']).optional(),
});

// ExchangeFiltersSchema is the schema for filtering exchange data
export const ExchangeFiltersSchema = z.object({
    exchangeId: z.string().uuid().optional(),
    exchangeOwnerId: z.string().optional(), // Filter by owner
    type: z.enum(['inbound', 'outbound']).optional(),
    sender: z.string().optional(),
    recipient: z.string().email().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.number().min(1).max(1000).default(50),
    offset: z.number().min(0).default(0),
});

// Service Result Schema (reusable)
export const ServiceResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        success: z.boolean(),
        data: dataSchema.optional(),
        error: z.string().optional(),
    });

// Specific service result schemas
export const GetExchangeDataResultSchema = ServiceResultSchema(z.array(ExchangeDataSchema));
export const CreateExchangeDataResultSchema = ServiceResultSchema(ExchangeDataSchema);
export const UpdateExchangeDataResultSchema = ServiceResultSchema(ExchangeDataSchema);
export const DeleteExchangeDataResultSchema = ServiceResultSchema(z.boolean());
