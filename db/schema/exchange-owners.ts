import { pgTable, uuid, integer, timestamp, index, unique, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { users } from './users';
import { inboxData } from './inbox';

// Exchange ownership table - associates exchanges with users
export const exchangeOwners = pgTable(
    'exchange_owners',
    {
        id: uuid('id').primaryKey().notNull().unique().defaultRandom(),
        exchangeId: uuid('exchange_id').notNull(),
        userId: integer('user_id')
            .notNull()
            .references(() => users.id),
        exchangeType: varchar('exchange_type', { length: 20 }).$type<
            | 'scheduling'
            | 'scheduled'
            | 'reminder'
            | 'query'
            | 'research'
            | 'brief'
            | 'monitor'
            | 'support'
            | 'dealflow'
        >(),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => [
        // Unique constraint to prevent duplicate exchange-user associations
        unique('unique_exchange_user').on(table.exchangeId, table.userId),

        // Indexes for common queries
        index('idx_exchange_owners_exchange_id').on(table.exchangeId),
        index('idx_exchange_owners_user_id').on(table.userId),
    ],
);

// Relations
export const exchangeOwnersRelations = relations(exchangeOwners, ({ one }) => ({
    user: one(users, {
        fields: [exchangeOwners.userId],
        references: [users.id],
    }),
}));

// Zod schemas
export const insertExchangeOwnerSchema = createInsertSchema(exchangeOwners);
export const selectExchangeOwnerSchema = createSelectSchema(exchangeOwners);
