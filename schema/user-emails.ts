import { userEmails } from '@/db/schema/user-emails';
import { z } from 'zod';

// Base schemas (these reference the database schema)
export type UserEmail = typeof userEmails.$inferSelect;
export type UserEmailInsert = typeof userEmails.$inferInsert;
export type UserEmailUpdate = Partial<UserEmailInsert>;

// Extended schema with primary status
export const UserEmailWithPrimarySchema = z
    .object({
        // Extend the base UserEmail type with isPrimary
        isPrimary: z.boolean(),
    })
    .and(z.any()); // This will be merged with the actual UserEmail type

// Service operation result schema
export const ServiceResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        success: z.boolean(),
        data: dataSchema.optional(),
        error: z.string().optional(),
    });

// Specific operation result schemas
export const GetUserEmailsResultSchema = ServiceResultSchema(z.array(UserEmailWithPrimarySchema));
export const AddUserEmailResultSchema = ServiceResultSchema(UserEmailWithPrimarySchema);
export const UpdateUserEmailResultSchema = ServiceResultSchema(UserEmailWithPrimarySchema);
export const DeleteUserEmailResultSchema = ServiceResultSchema(z.boolean());

// Input schemas for operations
export const AddUserEmailInputSchema = z.object({
    email: z.string().email(),
    isPrimary: z.boolean().optional(),
});

export const UpdateUserEmailInputSchema = z.object({
    isPrimary: z.boolean().optional(),
});

// Validation schemas
export const UserEmailValidationErrorSchema = z.object({
    field: z.string(),
    message: z.string(),
});

export const ValidationResultSchema = z.object({
    isValid: z.boolean(),
    errors: z.array(UserEmailValidationErrorSchema),
});

// Business logic schemas
export const EmailAvailabilityResultSchema = z.object({
    isAvailable: z.boolean(),
    existingUserId: z.string().optional(),
});

export const PrimaryEmailUpdateResultSchema = z.object({
    success: z.boolean(),
    previousPrimaryId: z.number().optional(),
    newPrimaryId: z.number().optional(),
    error: z.string().optional(),
});
