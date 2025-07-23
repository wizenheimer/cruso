import { userEmails } from '@/db/schema/user-emails';
import {
    AddUserEmailInputSchema,
    AddUserEmailResultSchema,
    DeleteUserEmailResultSchema,
    GetUserEmailsResultSchema,
    UpdateUserEmailInputSchema,
    UpdateUserEmailResultSchema,
    UserEmailWithPrimarySchema,
    UserEmailValidationErrorSchema,
    EmailAvailabilityResultSchema,
    PrimaryEmailUpdateResultSchema,
    ServiceResultSchema,
    ValidationResultSchema,
} from '@/schema/user-emails';
import { z } from 'zod';

// Base schemas (these reference the database schema)

/**
 * User email record as stored in the database.
 * Contains email information including id, userId, email, isPrimary, and timestamps.
 * Used for reading user email data from the database.
 * @see db/schema/user-emails.ts - Source schema definition
 * @see db/queries/user-emails.ts - Used in email queries
 */
export type UserEmail = typeof userEmails.$inferSelect;

/**
 * User email data for inserting new records into the database.
 * Contains required fields for creating a new user email association.
 * Used when adding new email addresses to a user account.
 * @see db/schema/user-emails.ts - Source schema definition
 * @see db/queries/user-emails.ts - Used in createUserEmail query
 */
export type UserEmailInsert = typeof userEmails.$inferInsert;

/**
 * User email data for updating existing records in the database.
 * Contains optional fields that can be modified during email updates.
 * Used when modifying email information or changing primary email status.
 * @see db/schema/user-emails.ts - Source schema definition
 * @see db/queries/user-emails.ts - Used in updateUserEmail query
 */
export type UserEmailUpdate = Partial<UserEmailInsert>;

// Inferred Types from Zod Schemas

/**
 * User email with primary email information included.
 * Contains email data along with primary email status and validation.
 * Used for displaying email lists with primary email indicators.
 * @see schema/user-emails.ts - UserEmailWithPrimarySchema definition
 * @see services/user-emails/index.ts - Used in getUserEmails service
 * @see api/routes/user-email/index.ts - Used in GET emails endpoint
 */
export type UserEmailWithPrimary = z.infer<typeof UserEmailWithPrimarySchema>;

/**
 * Generic service result wrapper for API responses.
 * Provides consistent error handling and success/failure status.
 * Used across all user email service operations for standardized responses.
 * @see schema/user-emails.ts - ServiceResultSchema definition
 * @see services/user-emails/index.ts - Used in email service responses
 */
export type ServiceResult<T> = z.infer<ReturnType<typeof ServiceResultSchema<z.ZodType<T>>>>;

/**
 * Result of a user emails retrieval operation.
 * Contains list of user emails or error information.
 * Used when fetching all emails associated with a user.
 * @see schema/user-emails.ts - GetUserEmailsResultSchema definition
 * @see api/routes/user-email/index.ts - Used in GET emails endpoint
 */
export type GetUserEmailsResult = z.infer<typeof GetUserEmailsResultSchema>;

/**
 * Result of adding a new user email operation.
 * Contains the added email data or error information.
 * Used when adding new email addresses to a user account.
 * @see schema/user-emails.ts - AddUserEmailResultSchema definition
 * @see api/routes/user-email/index.ts - Used in POST email endpoint
 */
export type AddUserEmailResult = z.infer<typeof AddUserEmailResultSchema>;

/**
 * Result of updating a user email operation.
 * Contains the updated email data or error information.
 * Used when modifying email information or changing primary status.
 * @see schema/user-emails.ts - UpdateUserEmailResultSchema definition
 * @see api/routes/user-email/index.ts - Used in PATCH email endpoint
 */
export type UpdateUserEmailResult = z.infer<typeof UpdateUserEmailResultSchema>;

/**
 * Result of deleting a user email operation.
 * Contains success confirmation or error information.
 * Used when removing email addresses from a user account.
 * @see schema/user-emails.ts - DeleteUserEmailResultSchema definition
 * @see api/routes/user-email/index.ts - Used in DELETE email endpoint
 */
export type DeleteUserEmailResult = z.infer<typeof DeleteUserEmailResultSchema>;

/**
 * Input data for adding a new user email.
 * Contains email address and optional primary status.
 * Used as request body when adding emails via API.
 * @see schema/user-emails.ts - AddUserEmailInputSchema definition
 * @see api/routes/user-email/index.ts - Used in POST email endpoint validation
 */
export type AddUserEmailInput = z.infer<typeof AddUserEmailInputSchema>;

/**
 * Input data for updating an existing user email.
 * Contains fields that can be modified during email updates.
 * Used as request body when updating emails via API.
 * @see schema/user-emails.ts - UpdateUserEmailInputSchema definition
 * @see api/routes/user-email/index.ts - Used in PATCH email endpoint validation
 */
export type UpdateUserEmailInput = z.infer<typeof UpdateUserEmailInputSchema>;

/**
 * Validation error information for user email operations.
 * Contains specific error details and validation messages.
 * Used for providing detailed error feedback to users.
 * @see schema/user-emails.ts - UserEmailValidationErrorSchema definition
 * @see services/user-emails/index.ts - Used in email validation
 */
export type UserEmailValidationError = z.infer<typeof UserEmailValidationErrorSchema>;

/**
 * Generic validation result for user email operations.
 * Contains validation status and error information.
 * Used for consistent validation error handling.
 * @see schema/user-emails.ts - ValidationResultSchema definition
 * @see services/user-emails/index.ts - Used in email validation
 */
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

/**
 * Result of email availability check operation.
 * Contains whether an email is available for use or already taken.
 * Used when checking if an email can be added to a user account.
 * @see schema/user-emails.ts - EmailAvailabilityResultSchema definition
 * @see services/user-emails/index.ts - Used in checkEmailAvailability service
 * @see api/routes/user-email/index.ts - Used in email availability endpoint
 */
export type EmailAvailabilityResult = z.infer<typeof EmailAvailabilityResultSchema>;

/**
 * Result of updating primary email operation.
 * Contains success confirmation or error information.
 * Used when changing which email is the primary email for a user.
 * @see schema/user-emails.ts - PrimaryEmailUpdateResultSchema definition
 * @see services/user-emails/index.ts - Used in updatePrimaryEmail service
 * @see api/routes/user-email/index.ts - Used in primary email update endpoint
 */
export type PrimaryEmailUpdateResult = z.infer<typeof PrimaryEmailUpdateResultSchema>;
