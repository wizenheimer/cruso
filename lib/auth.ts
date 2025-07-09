import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db'; // your drizzle instance
import { user, account, session, verification } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';
import { ConnectionManager } from '@/services/calendar/connection';
import { authCookiePrefix } from './auth-constants';

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
            // Request offline access to get refresh tokens
            authorizationParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
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
            updateUserInfoOnLink: false,
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
                    console.log('Database hook: Account created!');
                    console.log('Account:', account);

                    if (account.providerId === 'google') {
                        console.log('Processing Google account calendar sync...');
                        try {
                            // Get the user info
                            const userData = await db.query.user.findFirst({
                                where: eq(user.id, account.userId),
                            });

                            if (userData && account.accessToken) {
                                await ConnectionManager.handleGoogleCalendarConnection({
                                    userId: account.userId,
                                    account,
                                    profile: {
                                        email: userData.email,
                                        name: userData.name,
                                    },
                                });
                                console.log('Database hook calendar sync completed successfully');
                            } else {
                                console.log('Missing user data or access token for calendar sync');
                                console.log('UserData exists:', !!userData);
                                console.log('Access token exists:', !!account.accessToken);
                            }
                        } catch (error) {
                            console.error('Error in database hook calendar sync:', error);
                            console.error('Full error stack:', error);
                        }
                    } else {
                        console.log(`Skipping calendar sync for provider: ${account.providerId}`);
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
