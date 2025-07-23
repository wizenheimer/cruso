import { z } from 'zod';

// Service operation result schema
export const ServiceResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        success: z.boolean(),
        data: dataSchema.optional(),
        error: z.string().optional(),
    });

// User input schemas for API validation
export const CreateUserInputSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().min(1),
    image: z.string().optional(),
});

export const UpdateUserInputSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    image: z.string().optional(),
    emailVerified: z.boolean().optional(),
});

// Result schemas (using z.any() since actual types come from types/users.ts)
export const GetUserResultSchema = ServiceResultSchema(z.any());
export const CreateUserResultSchema = ServiceResultSchema(z.any());
export const UpdateUserResultSchema = ServiceResultSchema(z.any());
export const DeleteUserResultSchema = ServiceResultSchema(z.boolean());
