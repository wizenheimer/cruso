import { userEmails } from '@/db/schema/user-emails';

// Base types
export type UserEmail = typeof userEmails.$inferSelect;
export type UserEmailInsert = typeof userEmails.$inferInsert;
export type UserEmailUpdate = Partial<UserEmailInsert>;

// Extended types with primary status
export type UserEmailWithPrimary = UserEmail & {
    isPrimary: boolean;
};

// Service operation results
export type ServiceResult<T> = {
    success: boolean;
    data?: T;
    error?: string;
};

// Specific operation results
export type GetUserEmailsResult = ServiceResult<UserEmailWithPrimary[]>;
export type AddUserEmailResult = ServiceResult<UserEmailWithPrimary>;
export type UpdateUserEmailResult = ServiceResult<UserEmailWithPrimary>;
export type DeleteUserEmailResult = ServiceResult<boolean>;

// Input types for operations
export type AddUserEmailInput = {
    email: string;
    isPrimary?: boolean;
};

export type UpdateUserEmailInput = {
    isPrimary?: boolean;
};

// Validation types
export type UserEmailValidationError = {
    field: string;
    message: string;
};

export type ValidationResult = {
    isValid: boolean;
    errors: UserEmailValidationError[];
};

// Business logic types
export type EmailAvailabilityResult = {
    isAvailable: boolean;
    existingUserId?: string;
};

export type PrimaryEmailUpdateResult = {
    success: boolean;
    previousPrimaryId?: number;
    newPrimaryId?: number;
    error?: string;
};
