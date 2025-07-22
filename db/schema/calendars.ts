import { pgTable, varchar, text, timestamp, boolean, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { account, user } from '@/db/schema/auth';

/**
 * Google Calendar connections
 */
export const calendarConnections = pgTable(
    'calendar_connections',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        userId: text('user_id').references(() => user.id, {
            onDelete: 'cascade',
        }),

        // Link to Better Auth accounts table
        accountId: varchar('account_id', { length: 255 }).references(() => account.id, {
            onDelete: 'cascade',
        }),

        // Google account info
        googleAccountId: varchar('google_account_id', { length: 255 }).notNull(),
        googleEmail: varchar('google_email', { length: 255 }).notNull(),

        // Calendar specific info
        calendarId: varchar('calendar_id', { length: 255 }).notNull(),
        calendarName: varchar('calendar_name', { length: 255 }),
        calendarTimeZone: varchar('calendar_timezone', { length: 100 }),

        // Sync tracking
        lastSyncAt: timestamp('last_sync_at'),
        syncStatus: varchar('sync_status', { length: 50 }).default('active'), // 'active', 'error', 'paused'
        errorMessage: text('error_message'),

        // Calendar settings
        isPrimary: boolean('is_primary').default(false),
        includeInAvailability: boolean('include_in_availability').default(true),
        isActive: boolean('is_active').default(true),

        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => [
        index('idx_calendar_connections_user').on(table.userId),
        index('idx_calendar_connections_account').on(table.accountId),
        index('idx_calendar_connections_google_account').on(table.googleAccountId),
        index('idx_calendar_connections_sync_status').on(table.syncStatus),
        unique('calendar_connections_user_google_account_calendar_unique').on(
            table.userId,
            table.googleAccountId,
            table.calendarId,
        ),
    ],
);

/**
 * Relations
 */
export const calendarConnectionsRelations = relations(calendarConnections, ({ one }) => ({
    user: one(user, {
        fields: [calendarConnections.userId],
        references: [user.id],
    }),
    account: one(account, {
        fields: [calendarConnections.accountId],
        references: [account.id],
    }),
}));

/**
 * Zod schemas
 */
export const insertCalendarConnectionSchema = createInsertSchema(calendarConnections);
export const selectCalendarConnectionSchema = createSelectSchema(calendarConnections);
