import { db } from '@/db';
import { userEmails } from '@/db/schema/user-emails';
import { preferences } from '@/db/schema/preferences';
import { eq, and, ne } from 'drizzle-orm';
import { updatePrimaryUserEmail } from '@/db/queries/preferences';
import {
    UserEmailWithPrimary,
    GetUserEmailsResult,
    AddUserEmailResult,
    UpdateUserEmailResult,
    DeleteUserEmailResult,
    AddUserEmailInput,
    UpdateUserEmailInput,
    ValidationResult,
    EmailAvailabilityResult,
    PrimaryEmailUpdateResult,
} from '@/types/user-emails';

export class UserEmailService {
    /**
     * Get all active emails for a user with primary status
     */
    async getUserEmails(userId: string): Promise<GetUserEmailsResult> {
        try {
            // Get user's primary email ID from preferences
            const [userPrefs] = await db
                .select({ primaryUserEmailId: preferences.primaryUserEmailId })
                .from(preferences)
                .where(and(eq(preferences.userId, userId), eq(preferences.isActive, true)))
                .limit(1);

            const emails = await db
                .select({
                    id: userEmails.id,
                    userId: userEmails.userId,
                    email: userEmails.email,
                    isActive: userEmails.isActive,
                    createdAt: userEmails.createdAt,
                    updatedAt: userEmails.updatedAt,
                })
                .from(userEmails)
                .where(and(eq(userEmails.userId, userId), eq(userEmails.isActive, true)))
                .orderBy(userEmails.createdAt);

            // Add isPrimary field based on preferences
            const emailsWithPrimary: UserEmailWithPrimary[] = emails.map((email) => ({
                ...email,
                isPrimary: userPrefs?.primaryUserEmailId === email.id,
            }));

            return {
                success: true,
                data: emailsWithPrimary,
            };
        } catch (error) {
            console.error('Error fetching user emails:', error);
            return {
                success: false,
                error: 'Failed to fetch user emails',
            };
        }
    }

    /**
     * Check if an email is available globally
     */
    async checkEmailAvailability(email: string): Promise<EmailAvailabilityResult> {
        try {
            const existingEmail = await db
                .select({ userId: userEmails.userId })
                .from(userEmails)
                .where(and(eq(userEmails.email, email), eq(userEmails.isActive, true)))
                .limit(1);

            return {
                isAvailable: existingEmail.length === 0,
                existingUserId: existingEmail[0]?.userId || undefined,
            };
        } catch (error) {
            console.error('Error checking email availability:', error);
            return {
                isAvailable: false,
            };
        }
    }

    /**
     * Validate email input
     */
    validateEmailInput(input: AddUserEmailInput): ValidationResult {
        const errors: Array<{ field: string; message: string }> = [];

        if (!input.email) {
            errors.push({ field: 'email', message: 'Email address is required' });
        } else if (!this.isValidEmail(input.email)) {
            errors.push({ field: 'email', message: 'Invalid email format' });
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    /**
     * Add a new email address for a user
     */
    async addUserEmail(userId: string, input: AddUserEmailInput): Promise<AddUserEmailResult> {
        try {
            // Validate input
            const validation = this.validateEmailInput(input);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors[0]?.message || 'Validation failed',
                };
            }

            // Check if email already exists globally
            const availability = await this.checkEmailAvailability(input.email);
            if (!availability.isAvailable) {
                return {
                    success: false,
                    error: 'Email address already exists',
                };
            }

            // Get current emails to determine if this should be primary
            const currentEmails = await db
                .select()
                .from(userEmails)
                .where(and(eq(userEmails.userId, userId), eq(userEmails.isActive, true)));

            const shouldBePrimary = currentEmails.length === 0 || input.isPrimary === true;

            const newEmail = await db
                .insert(userEmails)
                .values({
                    userId,
                    email: input.email,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            // If this should be primary, update preferences
            if (shouldBePrimary) {
                const primaryUpdate = await this.updatePrimaryEmail(userId, newEmail[0].id);
                if (!primaryUpdate.success) {
                    console.error('Error updating preferences primary email:', primaryUpdate.error);
                    // Don't fail the request if preferences update fails
                }
            }

            // Return the email with isPrimary field
            const emailWithPrimary: UserEmailWithPrimary = {
                ...newEmail[0],
                isPrimary: shouldBePrimary,
            };

            return {
                success: true,
                data: emailWithPrimary,
            };
        } catch (error) {
            console.error('Error adding user email:', error);
            return {
                success: false,
                error: 'Failed to add user email',
            };
        }
    }

    /**
     * Update a user email (currently only supports setting as primary)
     */
    async updateUserEmail(
        userId: string,
        emailId: number,
        input: UpdateUserEmailInput,
    ): Promise<UpdateUserEmailResult> {
        try {
            // Check if email exists and belongs to user
            const existingEmail = await db
                .select()
                .from(userEmails)
                .where(
                    and(
                        eq(userEmails.id, emailId),
                        eq(userEmails.userId, userId),
                        eq(userEmails.isActive, true),
                    ),
                )
                .limit(1);

            if (existingEmail.length === 0) {
                return {
                    success: false,
                    error: 'Email not found',
                };
            }

            // If setting as primary, update preferences
            if (input.isPrimary === true) {
                const primaryUpdate = await this.updatePrimaryEmail(userId, emailId);
                if (!primaryUpdate.success) {
                    return {
                        success: false,
                        error: 'Failed to update primary email',
                    };
                }
            }

            const updatedEmail = await db
                .update(userEmails)
                .set({
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(userEmails.id, emailId),
                        eq(userEmails.userId, userId),
                        eq(userEmails.isActive, true),
                    ),
                )
                .returning();

            // Get current primary email ID to determine isPrimary status
            const [userPrefs] = await db
                .select({ primaryUserEmailId: preferences.primaryUserEmailId })
                .from(preferences)
                .where(and(eq(preferences.userId, userId), eq(preferences.isActive, true)))
                .limit(1);

            const emailWithPrimary: UserEmailWithPrimary = {
                ...updatedEmail[0],
                isPrimary: userPrefs?.primaryUserEmailId === emailId,
            };

            return {
                success: true,
                data: emailWithPrimary,
            };
        } catch (error) {
            console.error('Error updating user email:', error);
            return {
                success: false,
                error: 'Failed to update user email',
            };
        }
    }

    /**
     * Delete a user email (soft delete)
     */
    async deleteUserEmail(userId: string, emailId: number): Promise<DeleteUserEmailResult> {
        try {
            // Check if email exists and belongs to user
            const existingEmail = await db
                .select()
                .from(userEmails)
                .where(
                    and(
                        eq(userEmails.id, emailId),
                        eq(userEmails.userId, userId),
                        eq(userEmails.isActive, true),
                    ),
                )
                .limit(1);

            if (existingEmail.length === 0) {
                return {
                    success: false,
                    error: 'Email not found',
                };
            }

            // Check if this is the only email - prevent deletion if so
            const userEmailCount = await db
                .select()
                .from(userEmails)
                .where(and(eq(userEmails.userId, userId), eq(userEmails.isActive, true)));

            if (userEmailCount.length === 1) {
                return {
                    success: false,
                    error: 'Cannot delete the only email address',
                };
            }

            // Check if this is the primary email
            const [userPrefs] = await db
                .select({ primaryUserEmailId: preferences.primaryUserEmailId })
                .from(preferences)
                .where(and(eq(preferences.userId, userId), eq(preferences.isActive, true)))
                .limit(1);

            const isPrimary = userPrefs?.primaryUserEmailId === emailId;

            // If deleting primary email, make another email primary
            if (isPrimary) {
                const otherEmails = await db
                    .select()
                    .from(userEmails)
                    .where(
                        and(
                            eq(userEmails.userId, userId),
                            ne(userEmails.id, emailId),
                            eq(userEmails.isActive, true),
                        ),
                    )
                    .orderBy(userEmails.createdAt)
                    .limit(1);

                if (otherEmails.length > 0) {
                    const primaryUpdate = await this.updatePrimaryEmail(userId, otherEmails[0].id);
                    if (!primaryUpdate.success) {
                        console.error(
                            'Error updating preferences primary email:',
                            primaryUpdate.error,
                        );
                        // Don't fail the request if preferences update fails
                    }
                }
            }

            // Soft delete - mark as inactive
            await db
                .update(userEmails)
                .set({
                    isActive: false,
                    updatedAt: new Date(),
                })
                .where(
                    and(
                        eq(userEmails.id, emailId),
                        eq(userEmails.userId, userId),
                        eq(userEmails.isActive, true),
                    ),
                );

            return {
                success: true,
                data: true,
            };
        } catch (error) {
            console.error('Error deleting user email:', error);
            return {
                success: false,
                error: 'Failed to delete user email',
            };
        }
    }

    /**
     * Update primary email in preferences
     */
    private async updatePrimaryEmail(
        userId: string,
        primaryUserEmailId: number,
    ): Promise<PrimaryEmailUpdateResult> {
        try {
            await updatePrimaryUserEmail(userId, primaryUserEmailId);
            return {
                success: true,
                newPrimaryId: primaryUserEmailId,
            };
        } catch (error) {
            console.error('Error updating primary email:', error);
            return {
                success: false,
                error: 'Failed to update primary email',
            };
        }
    }

    /**
     * Simple email validation
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// Export singleton instance
export const userEmailService = new UserEmailService();
