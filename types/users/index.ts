import { user } from '@/db/schema/auth';
import {
    ServiceResultSchema,
    GetUserResultSchema,
    CreateUserResultSchema,
    UpdateUserResultSchema,
    DeleteUserResultSchema,
    CreateUserInputSchema,
    UpdateUserInputSchema,
} from '@/schema/users';
import { z } from 'zod';

// Database Schema Types (inferred from Drizzle schema)

/**
 * User record as stored in the database.
 * Contains all user information including id, email, name, and timestamps.
 * Used for reading user data from the database.
 * @see db/schema/auth.ts - Source schema definition
 * @see db/queries/users.ts - Used in user queries
 */
export type User = typeof user.$inferSelect;

/**
 * User data for inserting new records into the database.
 * Contains required fields for creating a new user.
 * Used when creating new user accounts.
 * @see db/schema/auth.ts - Source schema definition
 * @see db/queries/users.ts - Used in createUser query
 */
export type InsertUser = typeof user.$inferInsert;

/**
 * User data for updating existing records in the database.
 * Contains all user fields that can be updated.
 * Used when modifying user information.
 * @see db/schema/auth.ts - Source schema definition
 * @see db/queries/users.ts - Used in updateUser query
 */
export type UpdateUser = typeof user.$inferSelect;

/**
 * User data for deletion operations.
 * Contains user identification information for deletion.
 * Used when removing user accounts.
 * @see db/schema/auth.ts - Source schema definition
 * @see db/queries/users.ts - Used in deleteUser query
 */
export type DeleteUser = typeof user.$inferSelect;

// Inferred Types from Zod Schemas

/**
 * Generic service result wrapper for API responses.
 * Provides consistent error handling and success/failure status.
 * Used across all user service operations for standardized responses.
 * @see schema/users.ts - ServiceResultSchema definition
 * @see services/user-emails/index.ts - Used in email service responses
 * @see services/preferences/index.ts - Used in preferences service responses
 */
export type ServiceResult<T> = z.infer<ReturnType<typeof ServiceResultSchema<z.ZodType<T>>>>;

/**
 * Result of a user retrieval operation.
 * Contains user data or error information.
 * Used when fetching user information from the API.
 * @see schema/users.ts - GetUserResultSchema definition
 * @see api/routes/users/index.ts - Used in GET user endpoint
 */
export type GetUserResult = z.infer<typeof GetUserResultSchema>;

/**
 * Result of a user creation operation.
 * Contains the created user data or error information.
 * Used when creating new user accounts via API.
 * @see schema/users.ts - CreateUserResultSchema definition
 * @see api/routes/users/index.ts - Used in POST user endpoint
 */
export type CreateUserResult = z.infer<typeof CreateUserResultSchema>;

/**
 * Result of a user update operation.
 * Contains the updated user data or error information.
 * Used when modifying user information via API.
 * @see schema/users.ts - UpdateUserResultSchema definition
 * @see api/routes/users/index.ts - Used in PATCH user endpoint
 */
export type UpdateUserResult = z.infer<typeof UpdateUserResultSchema>;

/**
 * Result of a user deletion operation.
 * Contains success confirmation or error information.
 * Used when removing user accounts via API.
 * @see schema/users.ts - DeleteUserResultSchema definition
 * @see api/routes/users/index.ts - Used in DELETE user endpoint
 */
export type DeleteUserResult = z.infer<typeof DeleteUserResultSchema>;

/**
 * Input data for creating a new user.
 * Contains required and optional fields for user creation.
 * Used as request body when creating users via API.
 * @see schema/users.ts - CreateUserInputSchema definition
 * @see api/routes/users/index.ts - Used in POST user endpoint validation
 */
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

/**
 * Input data for updating an existing user.
 * Contains fields that can be modified during user updates.
 * Used as request body when updating users via API.
 * @see schema/users.ts - UpdateUserInputSchema definition
 * @see api/routes/users/index.ts - Used in PATCH user endpoint validation
 */
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;
