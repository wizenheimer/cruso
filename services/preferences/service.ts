import { db } from '@/db';
import { preferences } from '@/db/schema/preferences';
import { userEmails } from '@/db/schema/user-emails';
import { calendarConnections } from '@/db/schema/calendars';
import { availability } from '@/db/schema/availability';
import { account, user } from '@/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { PREFERENCES_DEFAULTS } from '@/constants/preferences';
import { generatePreferencesMarkdown, type PreferencesData } from '@/lib/preference';
import {
    Preference,
    PreferenceUpdate,
    PreferencesWithPrimaries,
    PrimaryEmailOption,
    PrimaryAccountOption,
    ServiceResult,
    GetPreferencesResult,
    CreatePreferencesResult,
    UpdatePreferencesResult,
    DeletePreferencesResult,
    UpdatePrimaryEmailResult,
    UpdatePrimaryAccountResult,
    GetPrimaryOptionsResult,
    ValidationResult,
    PreferenceValidationError,
} from './types';

/**
 * Preference Service
 *
 * Encapsulates all preference-related operations with proper error handling,
 * validation, and business logic abstraction.
 */
export class PreferenceService {
    /**
     * Get user preferences with primary email and account data
     */
    async getPreferences(userId: string): Promise<GetPreferencesResult> {
        try {
            console.log('[PREFERENCE_SERVICE] Getting preferences for user:', userId);

            const [userPrefs] = await db
                .select({
                    preferences: preferences,
                    primaryUserEmail: userEmails,
                    primaryAccount: account,
                })
                .from(preferences)
                .leftJoin(userEmails, eq(preferences.primaryUserEmailId, userEmails.id))
                .leftJoin(account, eq(preferences.primaryAccountId, account.id))
                .where(and(eq(preferences.userId, userId), eq(preferences.isActive, true)))
                .limit(1);

            if (!userPrefs) {
                console.log('[PREFERENCE_SERVICE] No preferences found for user:', userId);
                return {
                    success: false,
                    error: 'Preferences not found',
                };
            }

            console.log('[PREFERENCE_SERVICE] Preferences retrieved successfully');
            return {
                success: true,
                data: userPrefs as PreferencesWithPrimaries,
            };
        } catch (error) {
            console.error('[PREFERENCE_SERVICE] Error getting preferences:', error);
            return {
                success: false,
                error: 'Failed to get preferences',
            };
        }
    }

    /**
     * Get basic user preferences (without joins)
     */
    async getBasicPreferences(userId: string): Promise<ServiceResult<Preference>> {
        try {
            console.log('[PREFERENCE_SERVICE] Getting basic preferences for user:', userId);

            const [userPrefs] = await db
                .select()
                .from(preferences)
                .where(and(eq(preferences.userId, userId), eq(preferences.isActive, true)))
                .limit(1);

            if (!userPrefs) {
                return {
                    success: false,
                    error: 'Preferences not found',
                };
            }

            return {
                success: true,
                data: userPrefs,
            };
        } catch (error) {
            console.error('[PREFERENCE_SERVICE] Error getting basic preferences:', error);
            return {
                success: false,
                error: 'Failed to get preferences',
            };
        }
    }

    /**
     * Create default preferences for a user with smart defaults
     */
    async createDefaultPreferences(userId: string): Promise<CreatePreferencesResult> {
        try {
            console.log('[PREFERENCE_SERVICE] Creating default preferences for user:', userId);

            // Check if preferences already exist
            const existingResult = await this.getBasicPreferences(userId);
            if (existingResult.success && existingResult.data) {
                return {
                    success: false,
                    error: 'Preferences already exist for this user',
                };
            }

            const smartDefaults = await this.getSmartDefaults(userId);

            // Generate preferences document
            const document = await this.generatePreferencesDocument(
                userId,
                smartDefaults.displayName,
                smartDefaults.nickname,
                smartDefaults.timezone,
            );

            const [newPrefs] = await db
                .insert(preferences)
                .values({
                    userId,
                    document,
                    displayName: smartDefaults.displayName,
                    nickname: smartDefaults.nickname,
                    signature: smartDefaults.signature,
                    timezone: smartDefaults.timezone,
                    minNoticeMinutes: PREFERENCES_DEFAULTS.MIN_NOTICE_MINUTES,
                    maxDaysAhead: PREFERENCES_DEFAULTS.MAX_DAYS_AHEAD,
                    defaultMeetingDurationMinutes:
                        PREFERENCES_DEFAULTS.DEFAULT_MEETING_DURATION_MINUTES,
                    virtualBufferMinutes: PREFERENCES_DEFAULTS.VIRTUAL_BUFFER_MINUTES,
                    inPersonBufferMinutes: PREFERENCES_DEFAULTS.IN_PERSON_BUFFER_MINUTES,
                    backToBackBufferMinutes: PREFERENCES_DEFAULTS.BACK_TO_BACK_BUFFER_MINUTES,
                    flightBufferMinutes: PREFERENCES_DEFAULTS.FLIGHT_BUFFER_MINUTES,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            console.log('[PREFERENCE_SERVICE] Default preferences created successfully');
            return {
                success: true,
                data: newPrefs,
            };
        } catch (error) {
            console.error('[PREFERENCE_SERVICE] Error creating default preferences:', error);
            return {
                success: false,
                error: 'Failed to create default preferences',
            };
        }
    }

    /**
     * Create preferences for a new user with primary email and account references
     * This is specifically designed for the auth hook when a new user signs up
     */
    async createPreferencesForNewUser(
        userId: string,
        primaryUserEmailId: number,
        primaryAccountId: string,
        userName?: string,
    ): Promise<CreatePreferencesResult> {
        try {
            console.log('[PREFERENCE_SERVICE] Creating preferences for new user:', {
                userId,
                primaryUserEmailId,
                primaryAccountId,
                userName,
            });

            // Check if preferences already exist
            const existingResult = await this.getBasicPreferences(userId);
            if (existingResult.success && existingResult.data) {
                return {
                    success: false,
                    error: 'Preferences already exist for this user',
                };
            }

            // Get the primary calendar timezone if available
            const [primaryCalendar] = await db
                .select({
                    timezone: calendarConnections.calendarTimeZone,
                })
                .from(calendarConnections)
                .where(
                    and(
                        eq(calendarConnections.userId, userId),
                        eq(calendarConnections.isPrimary, true),
                        eq(calendarConnections.isActive, true),
                    ),
                )
                .limit(1);

            // Use calendar timezone if available, otherwise fallback to default
            const timezone = primaryCalendar?.timezone || PREFERENCES_DEFAULTS.TIMEZONE;

            // Determine display name, nickname, and signature
            const displayName = userName || PREFERENCES_DEFAULTS.DISPLAY_NAME;
            const nickname = userName || PREFERENCES_DEFAULTS.NICKNAME;
            const signature = userName
                ? `${userName}'s AI Assistant`
                : PREFERENCES_DEFAULTS.SIGNATURE;

            // Generate preferences document
            const document = await this.generatePreferencesDocument(
                userId,
                displayName,
                nickname,
                timezone,
            );

            console.log('[PREFERENCE_SERVICE] Generated document for new user:', {
                userId,
                documentLength: document.length,
                hasContent: document.length > 0,
            });

            const [newPrefs] = await db
                .insert(preferences)
                .values({
                    userId,
                    primaryUserEmailId,
                    primaryAccountId,
                    document,
                    displayName,
                    nickname,
                    signature,
                    timezone,
                    minNoticeMinutes: PREFERENCES_DEFAULTS.MIN_NOTICE_MINUTES,
                    maxDaysAhead: PREFERENCES_DEFAULTS.MAX_DAYS_AHEAD,
                    defaultMeetingDurationMinutes:
                        PREFERENCES_DEFAULTS.DEFAULT_MEETING_DURATION_MINUTES,
                    virtualBufferMinutes: PREFERENCES_DEFAULTS.VIRTUAL_BUFFER_MINUTES,
                    inPersonBufferMinutes: PREFERENCES_DEFAULTS.IN_PERSON_BUFFER_MINUTES,
                    backToBackBufferMinutes: PREFERENCES_DEFAULTS.BACK_TO_BACK_BUFFER_MINUTES,
                    flightBufferMinutes: PREFERENCES_DEFAULTS.FLIGHT_BUFFER_MINUTES,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            console.log(
                '[PREFERENCE_SERVICE] Preferences created successfully for new user with timezone:',
                timezone,
            );
            return {
                success: true,
                data: newPrefs,
            };
        } catch (error) {
            console.error('[PREFERENCE_SERVICE] Error creating preferences for new user:', error);
            return {
                success: false,
                error: 'Failed to create preferences for new user',
            };
        }
    }

    /**
     * Update user preferences
     */
    async updatePreferences(
        userId: string,
        updateData: PreferenceUpdate,
    ): Promise<UpdatePreferencesResult> {
        try {
            console.log('[PREFERENCE_SERVICE] Updating preferences for user:', userId);

            // Validate the update data
            const validation = this.validatePreferenceUpdate(updateData);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: `Validation failed: ${validation.errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`,
                };
            }

            // Check if preferences exist
            const existingResult = await this.getBasicPreferences(userId);
            if (!existingResult.success || !existingResult.data) {
                return {
                    success: false,
                    error: 'Preferences not found',
                };
            }

            const [updatedPrefs] = await db
                .update(preferences)
                .set({
                    ...updateData,
                    updatedAt: new Date(),
                })
                .where(and(eq(preferences.userId, userId), eq(preferences.isActive, true)))
                .returning();

            console.log('[PREFERENCE_SERVICE] Preferences updated successfully');
            return {
                success: true,
                data: updatedPrefs,
            };
        } catch (error) {
            console.error('[PREFERENCE_SERVICE] Error updating preferences:', error);
            return {
                success: false,
                error: 'Failed to update preferences',
            };
        }
    }

    /**
     * Delete user preferences (soft delete)
     */
    async deletePreferences(userId: string): Promise<DeletePreferencesResult> {
        try {
            console.log('[PREFERENCE_SERVICE] Deleting preferences for user:', userId);

            // Check if preferences exist
            const existingResult = await this.getBasicPreferences(userId);
            if (!existingResult.success || !existingResult.data) {
                return {
                    success: false,
                    error: 'Preferences not found',
                };
            }

            await db
                .update(preferences)
                .set({
                    isActive: false,
                    updatedAt: new Date(),
                })
                .where(and(eq(preferences.userId, userId), eq(preferences.isActive, true)));

            console.log('[PREFERENCE_SERVICE] Preferences deleted successfully');
            return {
                success: true,
                data: true,
            };
        } catch (error) {
            console.error('[PREFERENCE_SERVICE] Error deleting preferences:', error);
            return {
                success: false,
                error: 'Failed to delete preferences',
            };
        }
    }

    /**
     * Update primary user email reference
     */
    async updatePrimaryEmail(
        userId: string,
        primaryUserEmailId: number | null,
    ): Promise<UpdatePrimaryEmailResult> {
        try {
            console.log('[PREFERENCE_SERVICE] Updating primary email for user:', userId);

            // Check if preferences exist
            const existingResult = await this.getBasicPreferences(userId);
            if (!existingResult.success || !existingResult.data) {
                return {
                    success: false,
                    error: 'Preferences not found',
                };
            }

            // If primaryUserEmailId is provided, verify it belongs to the user
            if (primaryUserEmailId !== null) {
                const availableEmails = await this.getAvailablePrimaryEmails(userId);
                const emailExists = availableEmails.some(
                    (email) => email.id === primaryUserEmailId,
                );

                if (!emailExists) {
                    return {
                        success: false,
                        error: 'Email not found or does not belong to user',
                    };
                }
            }

            const [updatedPrefs] = await db
                .update(preferences)
                .set({
                    primaryUserEmailId,
                    updatedAt: new Date(),
                })
                .where(and(eq(preferences.userId, userId), eq(preferences.isActive, true)))
                .returning();

            console.log('[PREFERENCE_SERVICE] Primary email updated successfully');
            return {
                success: true,
                data: updatedPrefs,
            };
        } catch (error) {
            console.error('[PREFERENCE_SERVICE] Error updating primary email:', error);
            return {
                success: false,
                error: 'Failed to update primary email',
            };
        }
    }

    /**
     * Update primary account reference
     */
    async updatePrimaryAccount(
        userId: string,
        primaryAccountId: string | null,
    ): Promise<UpdatePrimaryAccountResult> {
        try {
            console.log('[PREFERENCE_SERVICE] Updating primary account for user:', userId);

            // Check if preferences exist
            const existingResult = await this.getBasicPreferences(userId);
            if (!existingResult.success || !existingResult.data) {
                return {
                    success: false,
                    error: 'Preferences not found',
                };
            }

            // If primaryAccountId is provided, verify it belongs to the user
            if (primaryAccountId !== null) {
                const availableAccounts = await this.getAvailablePrimaryAccounts(userId);
                const accountExists = availableAccounts.some(
                    (account) => account.accountId === primaryAccountId,
                );

                if (!accountExists) {
                    return {
                        success: false,
                        error: 'Account not found or does not belong to user',
                    };
                }
            }

            const [updatedPrefs] = await db
                .update(preferences)
                .set({
                    primaryAccountId,
                    updatedAt: new Date(),
                })
                .where(and(eq(preferences.userId, userId), eq(preferences.isActive, true)))
                .returning();

            console.log('[PREFERENCE_SERVICE] Primary account updated successfully');
            return {
                success: true,
                data: updatedPrefs,
            };
        } catch (error) {
            console.error('[PREFERENCE_SERVICE] Error updating primary account:', error);
            return {
                success: false,
                error: 'Failed to update primary account',
            };
        }
    }

    /**
     * Get available primary options for a user
     */
    async getPrimaryOptions(userId: string): Promise<GetPrimaryOptionsResult> {
        try {
            console.log('[PREFERENCE_SERVICE] Getting primary options for user:', userId);

            const [availableEmails, availableAccounts] = await Promise.all([
                this.getAvailablePrimaryEmails(userId),
                this.getAvailablePrimaryAccounts(userId),
            ]);

            console.log('[PREFERENCE_SERVICE] Primary options retrieved successfully');
            return {
                success: true,
                data: {
                    emails: availableEmails,
                    accounts: availableAccounts,
                },
            };
        } catch (error) {
            console.error('[PREFERENCE_SERVICE] Error getting primary options:', error);
            return {
                success: false,
                error: 'Failed to get primary options',
            };
        }
    }

    /**
     * Get or create preferences for a user
     * This is a convenience method that gets preferences or creates defaults if none exist
     */
    async getOrCreatePreferences(userId: string): Promise<GetPreferencesResult> {
        try {
            console.log('[PREFERENCE_SERVICE] Getting or creating preferences for user:', userId);

            // Try to get existing preferences
            const getResult = await this.getPreferences(userId);
            if (getResult.success && getResult.data) {
                return getResult;
            }

            // Create default preferences if none exist
            const createResult = await this.createDefaultPreferences(userId);
            if (!createResult.success) {
                return {
                    success: false,
                    error: createResult.error,
                };
            }

            // Get the newly created preferences with primaries
            return await this.getPreferences(userId);
        } catch (error) {
            console.error('[PREFERENCE_SERVICE] Error in getOrCreatePreferences:', error);
            return {
                success: false,
                error: 'Failed to get or create preferences',
            };
        }
    }

    /**
     * Private method to get smart defaults for user preferences
     */
    private async getSmartDefaults(userId: string) {
        // Get user info
        const [userData] = await db
            .select({
                name: user.name,
                email: user.email,
            })
            .from(user)
            .where(eq(user.id, userId))
            .limit(1);

        // Get primary email info
        const [primaryEmail] = await db
            .select({
                email: userEmails.email,
            })
            .from(userEmails)
            .innerJoin(preferences, eq(preferences.primaryUserEmailId, userEmails.id))
            .where(
                and(
                    eq(preferences.userId, userId),
                    eq(userEmails.isActive, true),
                    eq(preferences.isActive, true),
                ),
            )
            .limit(1);

        // Get timezone from primary calendar
        const [primaryCalendar] = await db
            .select({
                timezone: calendarConnections.calendarTimeZone,
            })
            .from(calendarConnections)
            .where(
                and(
                    eq(calendarConnections.userId, userId),
                    eq(calendarConnections.isPrimary, true),
                    eq(calendarConnections.isActive, true),
                ),
            )
            .limit(1);

        // Determine display name (prefer user name, fallback to email prefix)
        let displayName = PREFERENCES_DEFAULTS.DISPLAY_NAME;
        if (userData?.name) {
            displayName = userData.name;
        } else if (primaryEmail?.email) {
            displayName = primaryEmail.email.split('@')[0];
        } else if (userData?.email) {
            displayName = userData.email.split('@')[0];
        }

        // Determine nickname (prefer email prefix, fallback to display name)
        let nickname = PREFERENCES_DEFAULTS.NICKNAME;
        if (primaryEmail?.email) {
            nickname = primaryEmail.email.split('@')[0];
        } else if (userData?.email) {
            nickname = userData.email.split('@')[0];
        } else if (displayName) {
            nickname = displayName;
        }

        // Determine signature (use display name)
        let signature = PREFERENCES_DEFAULTS.SIGNATURE;
        if (displayName) {
            signature = `${displayName}'s AI Assistant`;
        }

        // Determine timezone (prefer calendar timezone, fallback to defaults)
        let timezone = PREFERENCES_DEFAULTS.TIMEZONE;
        if (primaryCalendar?.timezone) {
            timezone = primaryCalendar.timezone;
        } else {
            // Try to find any calendar with a timezone
            const [anyCalendar] = await db
                .select({
                    timezone: calendarConnections.calendarTimeZone,
                })
                .from(calendarConnections)
                .where(
                    and(
                        eq(calendarConnections.userId, userId),
                        eq(calendarConnections.isActive, true),
                    ),
                )
                .limit(1);

            if (anyCalendar?.timezone) {
                timezone = anyCalendar.timezone;
            }
        }

        return {
            displayName,
            nickname,
            signature,
            timezone,
        };
    }

    /**
     * Private method to get available primary email options
     */
    private async getAvailablePrimaryEmails(userId: string): Promise<PrimaryEmailOption[]> {
        // Get current primary email ID from preferences
        const [userPrefs] = await db
            .select({ primaryUserEmailId: preferences.primaryUserEmailId })
            .from(preferences)
            .where(and(eq(preferences.userId, userId), eq(preferences.isActive, true)))
            .limit(1);

        const emails = await db
            .select({
                id: userEmails.id,
                email: userEmails.email,
            })
            .from(userEmails)
            .where(and(eq(userEmails.userId, userId), eq(userEmails.isActive, true)))
            .orderBy(userEmails.createdAt);

        // Add isPrimary field based on preferences
        return emails.map((email) => ({
            ...email,
            isPrimary: userPrefs?.primaryUserEmailId === email.id,
        }));
    }

    /**
     * Private method to get available primary account options
     */
    private async getAvailablePrimaryAccounts(userId: string): Promise<PrimaryAccountOption[]> {
        return await db
            .select({
                id: calendarConnections.id,
                accountId: calendarConnections.accountId,
                googleEmail: calendarConnections.googleEmail,
                calendarName: calendarConnections.calendarName,
                isPrimary: calendarConnections.isPrimary,
            })
            .from(calendarConnections)
            .where(
                and(eq(calendarConnections.userId, userId), eq(calendarConnections.isActive, true)),
            )
            .orderBy(calendarConnections.isPrimary, calendarConnections.createdAt);
    }

    /**
     * Private method to generate preferences document
     */
    private async generatePreferencesDocument(
        userId: string,
        displayName?: string,
        nickname?: string,
        timezone?: string,
    ): Promise<string> {
        try {
            console.log('[PREFERENCE_SERVICE] Generating document for user:', {
                userId,
                displayName,
                nickname,
                timezone,
            });

            // Get user availability
            const userAvailability = await db
                .select({
                    days: availability.days,
                    startTime: availability.startTime,
                    endTime: availability.endTime,
                    timezone: availability.timezone,
                })
                .from(availability)
                .where(eq(availability.userId, userId))
                .orderBy(availability.createdAt);

            console.log('[PREFERENCE_SERVICE] Found availability slots:', userAvailability.length);

            // Prepare data for document generation
            const preferencesData: PreferencesData = {
                displayName: displayName || undefined,
                nickname: nickname || undefined,
                availability: userAvailability.map((avail) => ({
                    days: avail.days || [],
                    startTime: avail.startTime,
                    endTime: avail.endTime,
                    timezone: avail.timezone,
                })),
                defaultTimezone: timezone || undefined,
                minNoticeMinutes: PREFERENCES_DEFAULTS.MIN_NOTICE_MINUTES,
                defaultMeetingDurationMinutes:
                    PREFERENCES_DEFAULTS.DEFAULT_MEETING_DURATION_MINUTES,
                virtualBufferMinutes: PREFERENCES_DEFAULTS.VIRTUAL_BUFFER_MINUTES,
                inPersonBufferMinutes: PREFERENCES_DEFAULTS.IN_PERSON_BUFFER_MINUTES,
                backToBackBufferMinutes: PREFERENCES_DEFAULTS.BACK_TO_BACK_BUFFER_MINUTES,
                flightBufferMinutes: PREFERENCES_DEFAULTS.FLIGHT_BUFFER_MINUTES,
            };

            // Generate the markdown document using the common utility
            return generatePreferencesMarkdown(preferencesData);
        } catch (error) {
            console.error('[PREFERENCE_SERVICE] Error generating preferences document:', error);
            return PREFERENCES_DEFAULTS.DOCUMENT;
        }
    }

    /**
     * Private method to validate preference update data
     */
    private validatePreferenceUpdate(updateData: PreferenceUpdate): ValidationResult {
        const errors: PreferenceValidationError[] = [];

        // Validate timezone if provided
        if (updateData.timezone !== undefined && updateData.timezone !== null) {
            if (typeof updateData.timezone !== 'string' || updateData.timezone.length > 100) {
                errors.push({
                    field: 'timezone',
                    message: 'Timezone must be a string with maximum 100 characters',
                });
            }
        }

        // Validate display name if provided
        if (updateData.displayName !== undefined && updateData.displayName !== null) {
            if (typeof updateData.displayName !== 'string' || updateData.displayName.length > 255) {
                errors.push({
                    field: 'displayName',
                    message: 'Display name must be a string with maximum 255 characters',
                });
            }
        }

        // Validate nickname if provided
        if (updateData.nickname !== undefined && updateData.nickname !== null) {
            if (typeof updateData.nickname !== 'string' || updateData.nickname.length > 255) {
                errors.push({
                    field: 'nickname',
                    message: 'Nickname must be a string with maximum 255 characters',
                });
            }
        }

        // Validate numeric fields
        const numericFields = [
            'minNoticeMinutes',
            'maxDaysAhead',
            'defaultMeetingDurationMinutes',
            'virtualBufferMinutes',
            'inPersonBufferMinutes',
            'backToBackBufferMinutes',
            'flightBufferMinutes',
        ] as const;

        for (const field of numericFields) {
            if (updateData[field] !== undefined && updateData[field] !== null) {
                if (typeof updateData[field] !== 'number' || updateData[field]! < 0) {
                    errors.push({
                        field,
                        message: `${field} must be a non-negative number`,
                    });
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}

// Export a singleton instance
export const preferenceService = new PreferenceService();
