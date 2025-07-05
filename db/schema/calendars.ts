import {
    pgTable,
    serial,
    integer,
    varchar,
    text,
    timestamp,
    boolean,
    index,
    unique,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Google Calendar connections
export const calendarConnections = pgTable(
    'calendar_connections',
    {
        id: serial('id').primaryKey(),
        userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
        calendarId: varchar('calendar_id', { length: 255 }).notNull(),
        calendarName: varchar('calendar_name', { length: 255 }),
        accessToken: text('access_token'),
        refreshToken: text('refresh_token'),
        tokenExpiresAt: timestamp('token_expires_at'),
        isPrimary: boolean('is_primary').default(false),
        includeInAvailability: boolean('include_in_availability').default(true),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => [
        index('idx_calendar_connections_user').on(table.userId),
        unique('calendar_connections_user_id_calendar_id_unique').on(
            table.userId,
            table.calendarId,
        ),
    ],
);

export const calendarConnectionsRelations = relations(calendarConnections, ({ one }) => ({
    user: one(users, {
        fields: [calendarConnections.userId],
        references: [users.id],
    }),
}));

export const insertCalendarConnectionSchema = createInsertSchema(calendarConnections);
export const selectCalendarConnectionSchema = createSelectSchema(calendarConnections);
