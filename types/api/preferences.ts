import { insertPreferencesSchema, preferences } from '@/db/schema/preferences';
import { userEmails } from '@/db/schema/user-emails';
import { account } from '@/db/schema/auth';

export const UpdatePreferencesSchema = insertPreferencesSchema
    .omit({
        id: true,
        userId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
    })
    .partial();

export const UpdatePrimaryEmailSchema = insertPreferencesSchema
    .pick({ primaryUserEmailId: true })
    .partial();

export const UpdatePrimaryAccountSchema = insertPreferencesSchema
    .pick({ primaryAccountId: true })
    .partial();

export type Preferences = typeof preferences.$inferSelect;
export type InsertPreferences = typeof preferences.$inferInsert;
export type UpdatePreferences = Partial<typeof preferences.$inferInsert>;
export type UpdatePrimaryEmail = Pick<typeof preferences.$inferInsert, 'primaryUserEmailId'>;
export type UpdatePrimaryAccount = Pick<typeof preferences.$inferInsert, 'primaryAccountId'>;

// Types for API responses
export interface PreferencesWithPrimaries {
    preferences: Preferences;
    primaryUserEmail: typeof userEmails.$inferSelect | null;
    primaryAccount: typeof account.$inferSelect | null;
}

export interface PrimaryEmailOption {
    id: number;
    email: string;
    isPrimary: boolean;
}

export interface PrimaryAccountOption {
    id: string;
    accountId: string | null;
    googleEmail: string;
    calendarName: string | null;
    isPrimary: boolean;
}

export interface PrimaryOptions {
    emails: PrimaryEmailOption[];
    accounts: PrimaryAccountOption[];
}
