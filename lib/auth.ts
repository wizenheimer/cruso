import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db'; // your drizzle instance
import { user, account, session, verification } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';
import { ConnectionManager } from '@/services/calendar/connection';
import { authCookiePrefix } from './auth-constants';
import { userEmails } from '@/db/schema/user-emails';
import { PreferenceService } from '@/services/preferences/service';

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
         * Account hooks - Sequencing is as follows:
         * 1. before: user creation
         * 2. after: user creation
         * 3. before: account creation
         * 4. after: account creation
         * 5. before: session creation
         * 6. after: session creation
         * Additional account creation skips user and session creation hooks
         * Additional session creation skips user and account creation hooks
         */
        user: {
            create: {
                before: async (user, ctx) => {
                    console.log('[DB_HOOK] Database hook: User creation started!');
                    console.log('[DB_HOOK] User details:', {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    });

                    if (ctx && ctx.context) {
                        ctx.context.isNewUser = true;
                        ctx.context.userEmail = user.email;
                        ctx.context.userName = user.name;
                    } else {
                        console.log('[DB_HOOK] Context is undefined for user creation before hook');
                    }
                },
                after: async (user) => {
                    console.log('[DB_HOOK] Database hook: User created!');
                    console.log('[DB_HOOK] User details:', {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    });
                },
            },
        },
        account: {
            create: {
                before: async (account, ctx) => {
                    console.log('[DB_HOOK] Database hook: Account creation started!');
                    console.log('[DB_HOOK] Account details:', {
                        id: account.id,
                        userId: account.userId,
                        providerId: account.providerId,
                        accountId: account.accountId,
                    });
                    console.log('[DB_HOOK] Context:', ctx);
                },
                after: async (account, ctx) => {
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
                    console.log('[DB_HOOK] Context:', ctx);

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

                                // Add user email as primary email on user creation
                                if (ctx && ctx.context.isNewUser) {
                                    console.log(
                                        '[DB_HOOK] Adding user email as primary email on user creation',
                                    );
                                    const userEmail = ctx.context.userEmail;
                                    const [newEmail] = await db
                                        .insert(userEmails)
                                        .values({
                                            userId: account.userId,
                                            email: userEmail,
                                        })
                                        .returning();

                                    console.log('[DB_HOOK] New email created:', newEmail);
                                    console.log(
                                        '[DB_HOOK] Creating preferences using PreferenceService...',
                                    );

                                    // Use the PreferenceService to create preferences
                                    const preferenceService = new PreferenceService();
                                    const result =
                                        await preferenceService.createPreferencesForNewUser(
                                            account.userId,
                                            newEmail.id,
                                            account.id,
                                            ctx.context.userName,
                                        );

                                    if (result.success) {
                                        console.log('[DB_HOOK] Preferences created successfully');
                                    } else {
                                        console.error(
                                            '[DB_HOOK] Failed to create preferences:',
                                            result.error,
                                        );
                                    }
                                }
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
        session: {
            create: {
                after: async (session) => {
                    console.log('[DB_HOOK] Database hook: Session created!');
                    console.log('[DB_HOOK] Session details:', {
                        id: session.id,
                        userId: session.userId,
                    });
                },
                before: async (session) => {
                    console.log('[DB_HOOK] Database hook: Session creation started!');
                    console.log('[DB_HOOK] Session details:', {
                        id: session.id,
                        userId: session.userId,
                    });
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
