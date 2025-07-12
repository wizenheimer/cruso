import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { schema } from '@/db/schema';
import { ConnectionManager } from '@/services/calendar/connection';
import { PreferenceService } from '@/services/preferences/service';

const { user, userEmails } = schema;

/**
 * Extract email from Google ID token
 */
export function extractEmailFromGoogleToken(idToken?: string | null): string | null {
    if (!idToken) {
        return null;
    }

    try {
        // Decode the JWT payload (base64 decode the middle part)
        const payload = idToken.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        const email = decodedPayload.email || null;

        return email;
    } catch (error) {
        console.error('[TOKEN] Error extracting email from ID token:', error);
        return null;
    }
}

/**
 * Handle Google account creation and calendar sync
 */
export async function handleGoogleCalendarConnection(account: any, context?: any) {
    try {
        // Get the user info
        const userData = await db.query.user.findFirst({
            where: eq(user.id, account.userId),
        });

        if (userData && account.accessToken) {
            // Extract Google email from ID token
            const calendarEmail = extractEmailFromGoogleToken(account.idToken);
            const userName = userData.name;

            // Associate with the calendar's email or fallback to existing user email
            const userEmail = calendarEmail || userData.email;

            // Handle Google calendar connection
            await ConnectionManager.handleGoogleCalendarConnection({
                userId: account.userId,
                account,
                profile: {
                    email: userEmail,
                    name: userName,
                },
            });

            // Add the user email to the context
            context.context.userEmail = userEmail;
            context.context.userName = userName;
        }
    } catch (error) {
        console.error('[DB_HOOK] Error in database hook calendar sync:', error);
        console.error('[DB_HOOK] Full error stack:', error);
    }
}

/**
 * Handle email connection adds the connected calendar email to the user emails table
 */
export async function handleEmailConnection(account: any, context: any) {
    // Get the user email
    const userEmail = context.context.userEmail;

    // Check if the email already exists for this user
    const existingEmail = await db.query.userEmails.findFirst({
        where: eq(userEmails.email, userEmail),
    });

    if (existingEmail) {
        // Email already exists, use the existing one
        context.context.addedEmail = existingEmail;
        return;
    }

    // Add the user email to the user emails table
    const [addedEmail] = await db
        .insert(userEmails)
        .values({
            userId: account.userId,
            email: userEmail,
        })
        .returning();

    // Add the added email to the context
    context.context.addedEmail = addedEmail;
}

/**
 * Handle new user preferences creation adds the connected calendar email to the user preferences table
 */
export async function handleNewUserPreferences(account: any, context: any) {
    // Get the newly added email
    const newEmail = context.context.addedEmail;
    const userName = context.context.userName;

    // Check if the user is newly created
    const isNewUser = context.context.isNewUser;
    if (!isNewUser) {
        return;
    }

    // Use the PreferenceService to create preferences
    const preferenceService = new PreferenceService();
    const result = await preferenceService.createPreferencesForNewUser(
        account.userId,
        newEmail.id,
        account.id,
        userName,
    );

    if (!result.success) {
        console.error('[DB_HOOK] Failed to create preferences:', result.error);
    }
}
