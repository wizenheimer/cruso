import { z } from 'zod';

// Primary options schemas
export const PrimaryEmailOptionSchema = z.object({
    id: z.number(),
    email: z.string().email(),
    isPrimary: z.boolean().nullable(),
});

export const PrimaryAccountOptionSchema = z.object({
    id: z.string(),
    accountId: z.string().nullable(),
    googleEmail: z.string().email(),
    calendarName: z.string().nullable(),
    isPrimary: z.boolean().nullable(),
});

// Service response schemas
export const PreferencesWithPrimariesSchema = z.object({
    preferences: z.any(), // Preference type from DB schema
    primaryUserEmail: z.any().nullable(), // userEmails.$inferSelect type
    primaryAccount: z.any().nullable(), // calendarConnections.$inferSelect type
});

export const PrimaryOptionsSchema = z.object({
    emails: z.array(PrimaryEmailOptionSchema),
    accounts: z.array(PrimaryAccountOptionSchema),
});

// Service operation result schema
export const ServiceResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        success: z.boolean(),
        data: dataSchema.optional(),
        error: z.string().optional(),
    });

// Specific operation result schemas
export const GetPreferencesResultSchema = ServiceResultSchema(PreferencesWithPrimariesSchema);
export const CreatePreferencesResultSchema = ServiceResultSchema(z.any()); // Preference type
export const UpdatePreferencesResultSchema = ServiceResultSchema(z.any()); // Preference type
export const DeletePreferencesResultSchema = ServiceResultSchema(z.boolean());
export const UpdatePrimaryEmailResultSchema = ServiceResultSchema(z.any()); // Preference type
export const UpdatePrimaryAccountResultSchema = ServiceResultSchema(z.any()); // Preference type
export const GetPrimaryOptionsResultSchema = ServiceResultSchema(PrimaryOptionsSchema);

// Validation schemas
export const PreferenceValidationErrorSchema = z.object({
    field: z.string(),
    message: z.string(),
});

export const ValidationResultSchema = z.object({
    isValid: z.boolean(),
    errors: z.array(PreferenceValidationErrorSchema),
});
