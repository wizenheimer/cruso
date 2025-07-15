import { db } from '@/db';
import { preferences } from '@/db/schema/preferences';
import { userEmails } from '@/db/schema/user-emails';
import { calendarConnections } from '@/db/schema/calendars';
import { account, user } from '@/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { PREFERENCES_DEFAULTS } from '@/constants/preferences';

/**
 * Get user preferences with primary email and account data
 */
export async function getUserPreferencesWithPrimaries(userId: string) {
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

    return userPrefs || null;
}

/**
 * Get user preferences (basic version without joins)
 */
export async function getUserPreferences(userId: string) {
    const [userPrefs] = await db
        .select()
        .from(preferences)
        .where(and(eq(preferences.userId, userId), eq(preferences.isActive, true)))
        .limit(1);

    return userPrefs || null;
}

/**
 * Get smart defaults for user preferences based on existing data
 */
async function getSmartDefaults(userId: string) {
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
                and(eq(calendarConnections.userId, userId), eq(calendarConnections.isActive, true)),
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
 * Create default preferences for a user with smart defaults
 */
export async function createDefaultPreferences(userId: string) {
    const smartDefaults = await getSmartDefaults(userId);

    const [newPrefs] = await db
        .insert(preferences)
        .values({
            userId,
            document: PREFERENCES_DEFAULTS.DOCUMENT,
            displayName: smartDefaults.displayName,
            nickname: smartDefaults.nickname,
            signature: smartDefaults.signature,
            timezone: smartDefaults.timezone,
            minNoticeMinutes: PREFERENCES_DEFAULTS.MIN_NOTICE_MINUTES,
            maxDaysAhead: PREFERENCES_DEFAULTS.MAX_DAYS_AHEAD,
            defaultMeetingDurationMinutes: PREFERENCES_DEFAULTS.DEFAULT_MEETING_DURATION_MINUTES,
            virtualBufferMinutes: PREFERENCES_DEFAULTS.VIRTUAL_BUFFER_MINUTES,
            inPersonBufferMinutes: PREFERENCES_DEFAULTS.IN_PERSON_BUFFER_MINUTES,
            backToBackBufferMinutes: PREFERENCES_DEFAULTS.BACK_TO_BACK_BUFFER_MINUTES,
            flightBufferMinutes: PREFERENCES_DEFAULTS.FLIGHT_BUFFER_MINUTES,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning();

    return newPrefs;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
    userId: string,
    updateData: Partial<typeof preferences.$inferInsert>,
) {
    const [updatedPrefs] = await db
        .update(preferences)
        .set({
            ...updateData,
            updatedAt: new Date(),
        })
        .where(and(eq(preferences.userId, userId), eq(preferences.isActive, true)))
        .returning();

    return updatedPrefs;
}

/**
 * Update primary user email reference
 */
export async function updatePrimaryUserEmail(userId: string, primaryUserEmailId: number | null) {
    const [updatedPrefs] = await db
        .update(preferences)
        .set({
            primaryUserEmailId,
            updatedAt: new Date(),
        })
        .where(and(eq(preferences.userId, userId), eq(preferences.isActive, true)))
        .returning();

    return updatedPrefs;
}

/**
 * Update primary account reference
 */
export async function updatePrimaryAccount(userId: string, primaryAccountId: string | null) {
    const [updatedPrefs] = await db
        .update(preferences)
        .set({
            primaryAccountId,
            updatedAt: new Date(),
        })
        .where(and(eq(preferences.userId, userId), eq(preferences.isActive, true)))
        .returning();

    return updatedPrefs;
}

/**
 * Get available primary email options for a user
 */
export async function getAvailablePrimaryEmails(userId: string) {
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
 * Get available primary account options for a user
 */
export async function getAvailablePrimaryAccounts(userId: string) {
    return await db
        .select({
            id: calendarConnections.id,
            accountId: calendarConnections.accountId,
            googleEmail: calendarConnections.googleEmail,
            calendarName: calendarConnections.calendarName,
            isPrimary: calendarConnections.isPrimary,
        })
        .from(calendarConnections)
        .where(and(eq(calendarConnections.userId, userId), eq(calendarConnections.isActive, true)))
        .orderBy(calendarConnections.isPrimary, calendarConnections.createdAt);
}
