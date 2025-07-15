import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db'; // your drizzle instance
import { user, account, session, verification } from '@/db/schema/auth';
import { authCookiePrefix } from '@/constants/auth';
import { userHooks, accountHooks, sessionHooks } from '@/hooks';

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
        user: userHooks,
        account: accountHooks,
        session: sessionHooks,
    },

    /**
     * Trusted origins
     * https://better-auth.com/docs/reference/configuration/trusted-origins
     */
    trustedOrigins: [process.env.BETTER_AUTH_URL || 'http://localhost:3000'],
});
