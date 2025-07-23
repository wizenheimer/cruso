import { preferences } from '@/db/schema/preferences';
import { userEmails } from '@/db/schema/user-emails';
import { calendarConnections } from '@/db/schema/calendars';

// Base preference types
export type Preference = typeof preferences.$inferSelect;
export type PreferenceInsert = typeof preferences.$inferInsert;
export type PreferenceUpdate = Partial<PreferenceInsert>;

// Primary options types
export type PrimaryEmailOption = {
    id: number;
    email: string;
    isPrimary: boolean | null;
};

export type PrimaryAccountOption = {
    id: string;
    accountId: string | null;
    googleEmail: string;
    calendarName: string | null;
    isPrimary: boolean | null;
};

// Service response types
export type PreferencesWithPrimaries = {
    preferences: Preference;
    primaryUserEmail: typeof userEmails.$inferSelect | null;
    primaryAccount: typeof calendarConnections.$inferSelect | null;
};

export type PrimaryOptions = {
    emails: PrimaryEmailOption[];
    accounts: PrimaryAccountOption[];
};

// Service operation results
export type ServiceResult<T> = {
    success: boolean;
    data?: T;
    error?: string;
};

// Specific operation results
export type GetPreferencesResult = ServiceResult<PreferencesWithPrimaries>;
export type CreatePreferencesResult = ServiceResult<Preference>;
export type UpdatePreferencesResult = ServiceResult<Preference>;
export type DeletePreferencesResult = ServiceResult<boolean>;
export type UpdatePrimaryEmailResult = ServiceResult<Preference>;
export type UpdatePrimaryAccountResult = ServiceResult<Preference>;
export type GetPrimaryOptionsResult = ServiceResult<PrimaryOptions>;

// Validation types
export type PreferenceValidationError = {
    field: string;
    message: string;
};

export type ValidationResult = {
    isValid: boolean;
    errors: PreferenceValidationError[];
};
