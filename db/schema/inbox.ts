import {
    pgTable,
    uuid,
    integer,
    varchar,
    text,
    timestamp,
    jsonb,
    index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm/relations';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// An exchange is a thread of emails that are related to each other
// A thread is a single email and its replies

// Inbox data table - global email storage without user scoping
export const inboxData = pgTable(
    'inbox_data',
    {
        id: uuid('id').primaryKey().notNull().unique(),
        parentId: uuid('parent_id').notNull(), // For tracking exchanges - an exchange can span across threads
        messageId: varchar('message_id', { length: 500 }).notNull().unique(),
        previousMessageId: varchar('previous_message_id', { length: 500 }),
        sender: varchar('sender', { length: 255 }).notNull(),
        recipients: jsonb('recipients').$type<string[]>().notNull(),
        subject: text('subject').notNull(),
        body: text('body').notNull(),
        timestamp: timestamp('timestamp').notNull(),
        type: varchar('type', { length: 10 }).notNull().$type<'inbound' | 'outbound'>(),
        metadata: jsonb('metadata').$type<Record<string, string>>().default({}),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => [
        // Primary indexes for common queries
        index('idx_inbox_data_parent_timestamp').on(table.parentId, table.timestamp.desc()),
        index('idx_inbox_data_message_id').on(table.messageId),
        index('idx_inbox_data_previous_message_id').on(table.previousMessageId),
        index('idx_inbox_data_sender').on(table.sender),
        index('idx_inbox_data_type_timestamp').on(table.type, table.timestamp.desc()),
        index('idx_inbox_data_timestamp').on(table.timestamp.desc()),

        // Composite indexes for complex queries
        index('idx_inbox_data_parent_type_timestamp').on(
            table.parentId,
            table.type,
            table.timestamp.desc(),
        ),

        // GIN index for recipients array search
        sql`CREATE INDEX IF NOT EXISTS idx_inbox_data_recipients_gin ON ${table} USING GIN (recipients)`,
    ],
);

// Relations - simplified without user scoping
export const inboxDataRelations = relations(inboxData, ({ one, many }) => ({
    parent: one(inboxData, {
        fields: [inboxData.parentId],
        references: [inboxData.id],
        relationName: 'thread',
    }),
    children: many(inboxData, {
        relationName: 'thread',
    }),
}));

// Zod schemas - auto-generated from Drizzle
export const insertInboxDataSchema = createInsertSchema(inboxData);
export const selectInboxDataSchema = createSelectSchema(inboxData);
