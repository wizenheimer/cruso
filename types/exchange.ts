import { z } from 'zod';
import { exchangeData } from '@/db/schema/exchange';

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

// Types - inferred from the DB schema
export type ExchangeData = typeof exchangeData.$inferSelect;
export type InsertExchangeData = typeof exchangeData.$inferInsert;
export type CreateExchangeData = z.infer<typeof CreateExchangeDataSchema>;
export type UpdateExchangeData = z.infer<typeof UpdateExchangeDataSchema>;
export type ExchangeFilters = z.infer<typeof ExchangeFiltersSchema>;
