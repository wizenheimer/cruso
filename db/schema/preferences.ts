import {
    pgTable,
    serial,
    integer,
    varchar,
    text,
    timestamp,
    boolean,
    index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import z from 'zod';

// Preferences Table - ONLY fast lookup stuff that impacts availability/scheduling
export const preferences = pgTable(
    'preferences',
    {
        id: serial('id').primaryKey(),
        userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
        document: text('document').notNull(), // Full natural language doc for LLM

        // UI display (rarely changes, avoid LLM lookup)
        displayName: varchar('display_name', { length: 255 }),
        nickname: varchar('nickname', { length: 255 }),

        // Fast availability/scheduling lookups
        timezone: varchar('timezone', { length: 100 }),
        minNoticeMinutes: integer('min_notice_minutes').default(120),
        maxDaysAhead: integer('max_days_ahead').default(60),

        // Default meeting settings
        defaultMeetingDurationMinutes: integer('default_meeting_duration_minutes').default(30),

        // Buffer settings (virtual vs in-person)
        bufferBeforeMinutes: integer('buffer_before_minutes').default(0),
        bufferAfterMinutes: integer('buffer_after_minutes').default(0),
        inPersonBufferBeforeMinutes: integer('in_person_buffer_before_minutes').default(15),
        inPersonBufferAfterMinutes: integer('in_person_buffer_after_minutes').default(15),

        // Advanced buffers
        backToBackLimitMinutes: integer('back_to_back_limit_minutes'),
        backToBackBufferMinutes: integer('back_to_back_buffer_minutes'),

        // Meeting clustering
        clusterMeetings: boolean('cluster_meetings').default(false),

        // New fields
        meetingNamingConvention: text('meeting_naming_convention'),
        refinement: text('refinement'),

        isActive: boolean('is_active').default(true),
        createdAt: timestamp('created_at').defaultNow(),
        updatedAt: timestamp('updated_at').defaultNow(),
    },
    (table) => [index('idx_preferences_user_active').on(table.userId, table.isActive)],
);

// Relations - Only used for ORM
export const preferencesRelations = relations(preferences, ({ one }) => ({
    user: one(users, {
        fields: [preferences.userId],
        references: [users.id],
    }),
}));

export const insertPreferencesSchema = createInsertSchema(preferences);
export const selectPreferencesSchema = createSelectSchema(preferences);
