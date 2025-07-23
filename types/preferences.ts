import { z } from 'zod';

import { preferences } from '@/db/schema/preferences';

import {
    PrimaryEmailOptionSchema,
    PrimaryAccountOptionSchema,
    PreferencesWithPrimariesSchema,
    PrimaryOptionsSchema,
    ServiceResultSchema,
    GetPreferencesResultSchema,
    CreatePreferencesResultSchema,
    UpdatePreferencesResultSchema,
    DeletePreferencesResultSchema,
    UpdatePrimaryEmailResultSchema,
    UpdatePrimaryAccountResultSchema,
    GetPrimaryOptionsResultSchema,
    PreferenceValidationErrorSchema,
    ValidationResultSchema,
} from '@/schema/preferences';

// Base preference schemas (these reference the database schema)

/**
 * User preference record as stored in the database.
 * Contains user preference settings including primary email and account selections.
 * Used for reading user preference data from the database.
 * @see db/schema/preferences.ts - Source schema definition
 * @see db/queries/preferences.ts - Used in preference queries
 */
export type Preference = typeof preferences.$inferSelect;

/**
 * User preference data for inserting new records into the database.
 * Contains required fields for creating new user preferences.
 * Used when setting up initial preferences for a new user.
 * @see db/schema/preferences.ts - Source schema definition
 * @see db/queries/preferences.ts - Used in createPreference query
 */
export type PreferenceInsert = typeof preferences.$inferInsert;

/**
 * User preference data for updating existing records in the database.
 * Contains optional fields that can be modified during preference updates.
 * Used when modifying user preference settings.
 * @see db/schema/preferences.ts - Source schema definition
 * @see db/queries/preferences.ts - Used in updatePreference query
 */
export type PreferenceUpdate = Partial<PreferenceInsert>;

// Inferred Types from Zod Schemas

/**
 * Primary email option for user preferences.
 * Contains email information that can be selected as the primary email.
 * Used for displaying available primary email choices to users.
 * @see schema/preferences.ts - PrimaryEmailOptionSchema definition
 * @see services/preferences/index.ts - Used in getPrimaryOptions service
 * @see api/routes/preference/index.ts - Used in GET primary options endpoint
 */
export type PrimaryEmailOption = z.infer<typeof PrimaryEmailOptionSchema>;

/**
 * Primary account option for user preferences.
 * Contains account information that can be selected as the primary account.
 * Used for displaying available primary account choices to users.
 * @see schema/preferences.ts - PrimaryAccountOptionSchema definition
 * @see services/preferences/index.ts - Used in getPrimaryOptions service
 * @see api/routes/preference/index.ts - Used in GET primary options endpoint
 */
export type PrimaryAccountOption = z.infer<typeof PrimaryAccountOptionSchema>;

/**
 * User preferences with primary email and account information included.
 * Contains preference data along with primary selections and validation.
 * Used for displaying complete preference information to users.
 * @see schema/preferences.ts - PreferencesWithPrimariesSchema definition
 * @see services/preferences/index.ts - Used in getUserPreferences service
 * @see api/routes/preference/index.ts - Used in GET preferences endpoint
 */
export type PreferencesWithPrimaries = z.infer<typeof PreferencesWithPrimariesSchema>;

/**
 * Available primary options for email and account selection.
 * Contains lists of available primary email and account choices.
 * Used for providing selection options when updating primary preferences.
 * @see schema/preferences.ts - PrimaryOptionsSchema definition
 * @see services/preferences/index.ts - Used in getPrimaryOptions service
 * @see api/routes/preference/index.ts - Used in GET primary options endpoint
 */
export type PrimaryOptions = z.infer<typeof PrimaryOptionsSchema>;

/**
 * Generic service result wrapper for API responses.
 * Provides consistent error handling and success/failure status.
 * Used across all preference service operations for standardized responses.
 * @see schema/preferences.ts - ServiceResultSchema definition
 * @see services/preferences/index.ts - Used in preference service responses
 */
export type ServiceResult<T> = z.infer<ReturnType<typeof ServiceResultSchema<z.ZodType<T>>>>;

/**
 * Result of a user preferences retrieval operation.
 * Contains user preference data or error information.
 * Used when fetching user preference settings from the API.
 * @see schema/preferences.ts - GetPreferencesResultSchema definition
 * @see api/routes/preference/index.ts - Used in GET preferences endpoint
 */
export type GetPreferencesResult = z.infer<typeof GetPreferencesResultSchema>;

/**
 * Result of creating user preferences operation.
 * Contains the created preference data or error information.
 * Used when setting up initial preferences for a new user.
 * @see schema/preferences.ts - CreatePreferencesResultSchema definition
 * @see api/routes/preference/index.ts - Used in POST preferences endpoint
 */
export type CreatePreferencesResult = z.infer<typeof CreatePreferencesResultSchema>;

/**
 * Result of updating user preferences operation.
 * Contains the updated preference data or error information.
 * Used when modifying user preference settings.
 * @see schema/preferences.ts - UpdatePreferencesResultSchema definition
 * @see api/routes/preference/index.ts - Used in PATCH preferences endpoint
 */
export type UpdatePreferencesResult = z.infer<typeof UpdatePreferencesResultSchema>;

/**
 * Result of deleting user preferences operation.
 * Contains success confirmation or error information.
 * Used when removing user preference settings.
 * @see schema/preferences.ts - DeletePreferencesResultSchema definition
 * @see api/routes/preference/index.ts - Used in DELETE preferences endpoint
 */
export type DeletePreferencesResult = z.infer<typeof DeletePreferencesResultSchema>;

/**
 * Result of updating primary email preference operation.
 * Contains success confirmation or error information.
 * Used when changing the primary email preference for a user.
 * @see schema/preferences.ts - UpdatePrimaryEmailResultSchema definition
 * @see services/preferences/index.ts - Used in updatePrimaryEmail service
 * @see api/routes/preference/index.ts - Used in primary email update endpoint
 */
export type UpdatePrimaryEmailResult = z.infer<typeof UpdatePrimaryEmailResultSchema>;

/**
 * Result of updating primary account preference operation.
 * Contains success confirmation or error information.
 * Used when changing the primary account preference for a user.
 * @see schema/preferences.ts - UpdatePrimaryAccountResultSchema definition
 * @see services/preferences/index.ts - Used in updatePrimaryAccount service
 * @see api/routes/preference/index.ts - Used in primary account update endpoint
 */
export type UpdatePrimaryAccountResult = z.infer<typeof UpdatePrimaryAccountResultSchema>;

/**
 * Result of retrieving primary options operation.
 * Contains available primary email and account choices.
 * Used when fetching available options for primary selections.
 * @see schema/preferences.ts - GetPrimaryOptionsResultSchema definition
 * @see services/preferences/index.ts - Used in getPrimaryOptions service
 * @see api/routes/preference/index.ts - Used in GET primary options endpoint
 */
export type GetPrimaryOptionsResult = z.infer<typeof GetPrimaryOptionsResultSchema>;

/**
 * Validation error information for preference operations.
 * Contains specific error details and validation messages.
 * Used for providing detailed error feedback to users.
 * @see schema/preferences.ts - PreferenceValidationErrorSchema definition
 * @see services/preferences/index.ts - Used in preference validation
 */
export type PreferenceValidationError = z.infer<typeof PreferenceValidationErrorSchema>;

/**
 * Generic validation result for preference operations.
 * Contains validation status and error information.
 * Used for consistent validation error handling.
 * @see schema/preferences.ts - ValidationResultSchema definition
 * @see services/preferences/index.ts - Used in preference validation
 */
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
