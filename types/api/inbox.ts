import { z } from 'zod';
import { inboxData } from '@/db/schema/inbox';

// API schemas - manual but referencing DB constraints to prevent drift
// NOTE: Keep these in sync with the inboxData table definition above

// CreateInboxDataSchema is the schema for creating a new inbox data
export const CreateInboxDataSchema = z.object({
    id: z.string().uuid(),
    exchangeId: z.string().uuid(),
    messageId: z.string().max(500), // Matches varchar(500) in DB
    previousMessageId: z.string().max(500).nullable(), // Previous message ID is nullable for first message in exchange
    sender: z.string().max(255), // Matches varchar(255) in DB
    recipients: z.array(z.string().email()).min(1), // Custom validation for email array
    subject: z.string(),
    body: z.string(),
    timestamp: z
        .string()
        .datetime()
        .or(z.date())
        .transform((val) => (val instanceof Date ? val : new Date(val))),
    type: z.enum(['inbound', 'outbound']),
});

// UpdateInboxDataSchema is the schema for updating an existing inbox data
export const UpdateInboxDataSchema = z.object({
    exchangeId: z.string().uuid(),
    previousMessageId: z.string().max(500).nullable(), // Previous message ID is nullable for first message in exchange
    sender: z.string().max(255).optional(),
    recipients: z.array(z.string().email()).min(1).optional(),
    subject: z.string().optional(),
    body: z.string().optional(),
    timestamp: z
        .string()
        .datetime()
        .or(z.date())
        .transform((val) => (val instanceof Date ? val : new Date(val)))
        .optional(),
    type: z.enum(['inbound', 'outbound']).optional(),
});

// InboxFiltersSchema is the schema for filtering inbox data
export const InboxFiltersSchema = z.object({
    exchangeId: z.string().uuid().optional(),
    type: z.enum(['inbound', 'outbound']).optional(),
    sender: z.string().optional(),
    recipient: z.string().email().optional(),
    subject: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    limit: z.number().min(1).max(1000).default(50),
    offset: z.number().min(0).default(0),
});

// Types - inferred from the DB schema
export type InboxData = typeof inboxData.$inferSelect;
export type InsertInboxData = typeof inboxData.$inferInsert;
export type CreateInboxData = z.infer<typeof CreateInboxDataSchema>;
export type UpdateInboxData = z.infer<typeof UpdateInboxDataSchema>;
export type InboxFilters = z.infer<typeof InboxFiltersSchema>;
