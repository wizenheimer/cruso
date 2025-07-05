import { googleAuth } from '@/services/auth/google';
import { Context } from 'hono';
import { users } from '@/db/schema/users';
import { calendarConnections } from '@/db/schema/calendars';
import { sql } from 'drizzle-orm';
import { db } from '@/db';

/*
 * Google OAuth 2.0 Authorization Code Flow
 *
 * Flow Diagram:
 *
 *    Frontend                    Backend API                 Google OAuth Server
 *       |                           |                              |
 *       |  1. GET /auth/url         |                              |
 *       |-------------------------->|                              |
 *       |  2. { authUrl }           |                              |
 *       |<--------------------------|                              |
 *       |                           |                              |
 *       |  3. Redirect user to authUrl                             |
 *       |--------------------------------------------------------->|
 *       |                           |                              |
 *       |                           |  4. User authenticates       |
 *       |                           |     with Google               |
 *       |                           |                              |
 *       |  5. Redirect back with code & state                      |
 *       |<---------------------------------------------------------|
 *       |     (to frontend callback URL)                          |
 *       |                           |                              |
 *       |  6. POST /auth/exchange   |                              |
 *       |     { code, userEmail }   |                              |
 *       |-------------------------->|                              |
 *       |                           |  7. Exchange code for tokens |
 *       |                           |----------------------------->|
 *       |                           |  8. { access_token, refresh_token }
 *       |                           |<-----------------------------|
 *       |                           |                              |
 *       |                           |  9. Get user info & calendars|
 *       |                           |----------------------------->|
 *       |                           | 10. User data & calendar list|
 *       |                           |<-----------------------------|
 *       |                           |                              |
 *       | 11. { user, calendars }   | 12. Store in database        |
 *       |<--------------------------|                              |
 *       |                           |                              |
 *
 * Step Details:
 * 1. Frontend requests Google OAuth URL
 * 2. Backend returns authorization URL with state parameter
 * 3. Frontend redirects user to Google's authorization server
 * 4. User completes authentication with Google
 * 5. Google redirects user back to frontend with authorization code
 * 6. Frontend extracts code from URL and sends to backend with user email
 * 7. Backend exchanges authorization code for access/refresh tokens
 * 8. Google returns tokens to backend
 * 9. Backend uses tokens to fetch user info and calendar list
 * 10. Google returns user data and calendars
 * 11. Backend responds with user info and calendar count
 * 12. Backend stores user and calendar connections in database
 */

// authURLHandler is called by the frontend to get the Google OAuth URL
export const authURLHandler = async (c: Context) => {
    try {
        await googleAuth.initializeOAuth2Client();
        const authUrl = googleAuth.generateAuthUrl();

        return c.json({
            authUrl,
            message: 'Visit this URL to authenticate with Google',
        });
    } catch (error) {
        return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
};

// authCallbackHandler is called by Google's authorization server after the user has authenticated
// It receives the authorization code and returns it to be exchanged for tokens
export const authCallbackHandler = async (c: Context) => {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');

    if (error) {
        return c.json({ error: `OAuth error: ${error}` }, 400);
    }

    if (!code) {
        return c.json({ error: 'No authorization code received from Google' }, 400);
    }

    // For now, return the code to the frontend
    // The frontend should then call /api/auth/google/exchange with this code
    return c.json({
        code,
        state: state || '',
        message:
            'Authorization code received. Please exchange it for tokens using /api/auth/google/exchange',
    });
};

// authExchangeHandler is called by the frontend after the user has authenticated with Google
// and has been redirected back to the frontend with the authorization code
export const authExchangeHandler = async (c: Context) => {
    const { code, userEmail } = await c.req.json();

    try {
        console.log('Starting OAuth exchange for:', userEmail);
        console.log('Authorization code received:', code.substring(0, 20) + '...');

        await googleAuth.initializeOAuth2Client();
        console.log('OAuth client initialized');

        const tokens = await googleAuth.getTokensFromCode(code);
        console.log('Tokens received:', {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            expiryDate: tokens.expiry_date,
        });

        // Set tokens immediately after getting them
        console.log('Setting user credentials...');
        googleAuth.setUserCredentials(
            tokens.access_token!,
            tokens.refresh_token || undefined,
            tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        );

        // Get user info from Google
        console.log('Getting user info from Google...');
        const userInfo = await googleAuth.getUserInfo();
        console.log('User info received:', userInfo.email);

        // Create or update user in database
        console.log('Creating/updating user in database...');
        const [user] = await db
            .insert(users)
            .values({
                email: userEmail,
            })
            .onConflictDoUpdate({
                target: users.email,
                set: {
                    updatedAt: sql`NOW()`,
                },
            })
            .returning();

        if (!user) throw new Error('Failed to create or update user');

        // Get user's Google calendars using the configured auth
        console.log("Fetching user's Google calendars...");
        const calendarAPI = googleAuth.getCalendarAPI();
        const calendarResponse = await calendarAPI.calendarList.list();
        const calendars = calendarResponse.data.items || [];
        console.log('Found', calendars.length, 'calendars');

        // Store calendar connections
        console.log('Storing calendar connections...');
        for (const cal of calendars) {
            await db
                .insert(calendarConnections)
                .values({
                    userId: user.id,
                    calendarId: cal.id!,
                    calendarName: cal.summary!,
                    accessToken: tokens.access_token || null,
                    refreshToken: tokens.refresh_token || null,
                    tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                    isPrimary: cal.primary || false,
                    includeInAvailability: true,
                })
                .onConflictDoUpdate({
                    target: [calendarConnections.userId, calendarConnections.calendarId],
                    set: {
                        accessToken: tokens.access_token || null,
                        refreshToken: tokens.refresh_token || null,
                        tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                        updatedAt: sql`NOW()`,
                    },
                });
        }

        console.log('OAuth exchange completed successfully!');
        return c.json({
            message: 'Authentication successful',
            user: user,
            googleUser: userInfo,
            calendarsFound: calendars.length,
        });
    } catch (error) {
        console.error('OAuth exchange failed:', error);
        return c.json(
            {
                error: `Authentication failed: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            },
            400,
        );
    }
};
