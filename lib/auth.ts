import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db'; // your drizzle instance
import { user, account, session, verification } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';
import { ConnectionManager } from '@/services/calendar/connection';
import { authCookiePrefix } from './auth-constants';

/**
 * Extract email from Google ID token
 */
function extractEmailFromGoogleToken(idToken?: string | null): string | null {
    console.log('[TOKEN] Extracting email from Google ID token...');
    console.log('[TOKEN] ID token exists:', !!idToken);

    if (!idToken) {
        console.log('[TOKEN] No ID token provided');
        return null;
    }

    try {
        // Decode the JWT payload (base64 decode the middle part)
        const payload = idToken.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        const email = decodedPayload.email || null;

        console.log('[TOKEN] Successfully extracted email:', email);
        console.log('[TOKEN] Full token payload keys:', Object.keys(decodedPayload));

        return email;
    } catch (error) {
        console.error('[TOKEN] Error extracting email from ID token:', error);
        return null;
    }
}

// Re-export for backward compatibility
export { authCookiePrefix };

/**
 * Google OAuth scopes
 * https://developers.google.com/identity/protocols/oauth2/scopes
 */
const googleScopes = [
    'openid', // required for Google OAuth
    'email', // read-only access to email
    'profile', // read-only access to profile
    'https://www.googleapis.com/auth/calendar.readonly', // read-only access to calendar
    'https://www.googleapis.com/auth/calendar.events', // read/write access to calendar events
    'https://www.googleapis.com/auth/calendar', // read/write access to calendar
];

/**
 * Better Auth configuration
 */
export const auth = betterAuth({
    /**
     * Database Configuration - Drizzle Adapter
     */
    database: drizzleAdapter(db, {
        provider: 'pg', // or "mysql", "sqlite"
        schema: {
            user: user,
            account: account,
            session: session,
            verification: verification,
        },
    }),

    /**
     * Secret and URL
     */
    secret: process.env.BETTER_AUTH_SECRET,
    url: process.env.BETTER_AUTH_URL,

    /**
     * Email and password - disabled for now
     */
    emailAndPassword: {
        enabled: false,
    },

    /**
     * Social providers
     */
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            scope: googleScopes,
            accessType: 'offline',
            prompt: 'consent',
        },
    },

    /**
     * Account linking
     * https://www.better-auth.com/docs/concepts/users-accounts#account-linking
     * Allows users to associate more than one calendars to their account
     */
    account: {
        accountLinking: {
            enabled: true,
            allowDifferentEmails: true,
            trustedProviders: ['google'],
        },
    },

    /**
     * Session - 30 days
     * https://better-auth.com/docs/reference/configuration/session
     */
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // 1 day
    },

    /**
     * Cookie Prefix
     */
    advanced: {
        cookiePrefix: authCookiePrefix,
    },

    /**
     * Database hooks
     * https://better-auth.com/docs/reference/configuration/database-hooks
     */
    databaseHooks: {
        /**
         * Account hooks
         */
        account: {
            create: {
                after: async (account) => {
                    console.log('\n[DB_HOOK] Database hook: Account created!');
                    console.log('[DB_HOOK] Account details:', {
                        id: account.id,
                        userId: account.userId,
                        providerId: account.providerId,
                        accountId: account.accountId,
                        hasAccessToken: !!account.accessToken,
                        hasIdToken: !!account.idToken,
                        hasRefreshToken: !!account.refreshToken,
                    });

                    if (account.providerId === 'google') {
                        console.log('[DB_HOOK] Processing Google account calendar sync...');
                        try {
                            // Get the user info
                            console.log('[DB_HOOK] Fetching user data for userId:', account.userId);
                            const userData = await db.query.user.findFirst({
                                where: eq(user.id, account.userId),
                            });

                            console.log('[DB_HOOK] User data found:', {
                                exists: !!userData,
                                email: userData?.email,
                                name: userData?.name,
                            });

                            if (userData && account.accessToken) {
                                console.log('[DB_HOOK] Starting Google email extraction...');
                                // Extract Google email from ID token
                                const googleEmail = extractEmailFromGoogleToken(account.idToken);

                                console.log('[DB_HOOK] Email comparison:', {
                                    originalUserEmail: userData.email,
                                    extractedGoogleEmail: googleEmail,
                                    willUse: googleEmail || userData.email,
                                });

                                console.log(
                                    '[DB_HOOK] Calling ConnectionManager.handleGoogleCalendarConnection...',
                                );
                                await ConnectionManager.handleGoogleCalendarConnection({
                                    userId: account.userId,
                                    account,
                                    profile: {
                                        email: googleEmail || userData.email, // Use Google email or fallback to user email
                                        name: userData.name,
                                    },
                                });
                                console.log(
                                    '[DB_HOOK] Database hook calendar sync completed successfully',
                                );
                            } else {
                                console.log(
                                    '[DB_HOOK] Missing user data or access token for calendar sync',
                                );
                                console.log('[DB_HOOK] UserData exists:', !!userData);
                                console.log(
                                    '[DB_HOOK] Access token exists:',
                                    !!account.accessToken,
                                );
                            }
                        } catch (error) {
                            console.error('[DB_HOOK] Error in database hook calendar sync:', error);
                            console.error('[DB_HOOK] Full error stack:', error);
                        }
                    } else {
                        console.log(
                            `[DB_HOOK] Skipping calendar sync for provider: ${account.providerId}`,
                        );
                    }
                },
            },
        },
    },

    /**
     * Trusted origins
     * https://better-auth.com/docs/reference/configuration/trusted-origins
     */
    trustedOrigins: [process.env.BETTER_AUTH_URL || 'http://localhost:3000'],
});
