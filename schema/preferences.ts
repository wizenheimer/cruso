import { z } from 'zod';

/**
 * Schema for updating user preferences.
 *
 * Instructions for handling updates:
 * - All fields are required in the schema
 * - If a field is provided with a value, update to the new value
 * - When processing updates, copy over final values from existing preferences when no update is provided
 *
 * Example:
 *
 * Existing preferences:
 * {
 *   displayName: "John Doe",
 *   nickname: "Johnny",
 *   timezone: "America/New_York",
 *   minNoticeMinutes: 30,
 *   maxDaysAhead: 90,
 *   defaultMeetingDurationMinutes: 60,
 *   virtualBufferMinutes: 15,
 *   inPersonBufferMinutes: 30,
 *   backToBackBufferMinutes: 10,
 *   flightBufferMinutes: 120,
 *   signature: "Best regards, John",
 * }
 *
 * Update request:
 * {
 *   timezone: "America/Los_Angeles", // Update timezone
 *   minNoticeMinutes: 60,        // Update minimum notice
 *   // Other fields not provided - should copy from existing
 * }
 *
 * Final result after merge:
 * {
 *   displayName: "John Doe",     // Copied from existing
 *   nickname: "Johnny",          // Copied from existing
 *   timezone: "America/Los_Angeles", // Updated
 *   minNoticeMinutes: 60,        // Updated
 *   maxDaysAhead: 90,            // Copied from existing
 *   defaultMeetingDurationMinutes: 60, // Copied from existing
 *   virtualBufferMinutes: 15,    // Copied from existing
 *   inPersonBufferMinutes: 30,   // Copied from existing
 *   backToBackBufferMinutes: 10, // Copied from existing
 *   flightBufferMinutes: 120,    // Copied from existing
 *   signature: "Best regards, John", // Copied from existing
 * }
 */
export const PreferenceUpdateExcludingSystemFieldsSchema = z.object({
    displayName: z.string().describe("User's display name for UI and calendar events"),
    nickname: z.string().describe("User's preferred nickname or informal name for email"),
    signature: z.string().describe('Email signature to be used while sending emails'),
    timezone: z
        .string()
        .describe("User's default IANA timezone for scheduling and time calculations"),
    minNoticeMinutes: z
        .number()
        .describe('Minimum notice time required before scheduling a meeting (in minutes)'),
    maxDaysAhead: z
        .number()
        .describe('Maximum number of days in advance meetings can be scheduled'),
    defaultMeetingDurationMinutes: z
        .number()
        .describe('Default duration for new meetings (in minutes)'),
    virtualBufferMinutes: z
        .number()
        .describe('Buffer time before and after virtual meetings (in minutes)'),
    inPersonBufferMinutes: z
        .number()
        .describe('Buffer time before and after in-person meetings (in minutes)'),
    backToBackBufferMinutes: z
        .number()
        .describe('Buffer time between consecutive meetings (in minutes)'),
    flightBufferMinutes: z
        .number()
        .describe('Buffer time before and after flight-related meetings (in minutes)'),
});

export const PreferenceUpdateUsingInstructionSchema =
    PreferenceUpdateExcludingSystemFieldsSchema.extend({
        document: z
            .string()
            .describe(
                'Updated preference document formatted as markdown,nearly organized into sections',
            ),
    });

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
