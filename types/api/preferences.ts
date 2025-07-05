import { insertPreferencesSchema, preferences } from '@/db/schema/preferences';

export const UpdatePreferencesSchema = insertPreferencesSchema
    .omit({
        id: true,
        userId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
    })
    .partial();

export type Preferences = typeof preferences.$inferSelect;
export type InsertPreferences = typeof preferences.$inferInsert;
