import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm/relations';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { user } from './auth';

/**
 * An exchange is a thread of emails that are related to each other
 * A thread is a single email and its replies
 */

/**
 * Exchange data table - global email storage with user ownership
 */
export const exchangeData = pgTable(
    'exchange_data',
    {
        id: uuid('id').primaryKey().notNull().unique(),
        exchangeId: uuid('exchange_id').notNull(), // For tracking exchanges - an exchange can span across threads
        exchangeOwnerId: text('exchange_owner_id')
            .notNull()
            .references(() => user.id, {
                onDelete: 'cascade',
            }), // Foreign key to user table for ownership
        messageId: varchar('message_id', { length: 500 }).notNull().unique(),
        previousMessageId: varchar('previous_message_id', { length: 500 }),
        sender: varchar('sender', { length: 255 }).notNull(),
        recipients: jsonb('recipients').$type<string[]>().notNull(),
        timestamp: timestamp('timestamp').notNull(),
        type: varchar('type', { length: 10 }).notNull().$type<'inbound' | 'outbound'>(),
    },
    (table) => [
        // Primary indexes for common queries
        index('idx_exchange_data_exchange_timestamp').on(table.exchangeId, table.timestamp.desc()),
        index('idx_exchange_data_message_id').on(table.messageId),
        index('idx_exchange_data_previous_message_id').on(table.previousMessageId),
        index('idx_exchange_data_sender').on(table.sender),
        index('idx_exchange_data_type_timestamp').on(table.type, table.timestamp.desc()),
        index('idx_exchange_data_timestamp').on(table.timestamp.desc()),
        index('idx_exchange_data_owner').on(table.exchangeOwnerId),

        // Composite indexes for complex queries
        index('idx_exchange_data_exchange_type_timestamp').on(
            table.exchangeId,
            table.type,
            table.timestamp.desc(),
        ),

        // GIN index for recipients array search
        sql`CREATE INDEX IF NOT EXISTS idx_exchange_data_recipients_gin ON ${table} USING GIN (recipients)`,
    ],
);

/**
 * Relations - with user ownership
 */
export const exchangeDataRelations = relations(exchangeData, ({ one, many }) => ({
    owner: one(user, {
        fields: [exchangeData.exchangeOwnerId],
        references: [user.id],
    }),
    parent: one(exchangeData, {
        fields: [exchangeData.exchangeId],
        references: [exchangeData.id],
        relationName: 'thread',
    }),
    children: many(exchangeData, {
        relationName: 'thread',
    }),
}));

/**
 * Zod schemas - auto-generated from Drizzle
 */
export const insertExchangeDataSchema = createInsertSchema(exchangeData);
export const selectExchangeDataSchema = createSelectSchema(exchangeData);
