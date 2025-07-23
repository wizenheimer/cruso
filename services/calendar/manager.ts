import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@/db';
import { account } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';
import { OAuthTokens } from '@/types/calendar';

/**
 * GoogleAuthManager is a class that manages the Google OAuth2 client.
 */
export class GoogleAuthManager {
    private oauth2Client: OAuth2Client;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID!,
            process.env.GOOGLE_CLIENT_SECRET!,
            process.env.GOOGLE_REDIRECT_URI,
        );
    }

    /**
     * Get an authenticated OAuth2 client for a specific account
     */
    async getAuthenticatedClient(accountId: string): Promise<OAuth2Client> {
        // Fetch account data from database
        const accountData = await db
            .select()
            .from(account)
            .where(eq(account.id, accountId))
            .limit(1);

        if (accountData.length === 0) {
            throw new Error('Account not found');
        }

        const acc = accountData[0];

        if (!acc.accessToken || !acc.refreshToken) {
            throw new Error('No tokens available for this account');
        }

        // Create a new OAuth2 client instance for this specific account
        const authClient = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID!,
            process.env.GOOGLE_CLIENT_SECRET!,
            process.env.GOOGLE_REDIRECT_URI,
        );

        // Set the credentials
        authClient.setCredentials({
            access_token: acc.accessToken,
            refresh_token: acc.refreshToken,
            expiry_date: acc.accessTokenExpiresAt?.getTime(),
        });

        // Set up automatic token refresh
        authClient.on('tokens', async (tokens) => {
            // Update tokens in database when they're refreshed
            await db
                .update(account)
                .set({
                    accessToken: tokens.access_token!,
                    accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                    updatedAt: new Date(),
                })
                .where(eq(account.id, accountId));
        });

        // Force a token refresh if needed
        const tokenInfo = await authClient.getAccessToken();
        if (!tokenInfo.token) {
            throw new Error('Failed to get access token');
        }

        return authClient;
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
        const { tokens } = await this.oauth2Client.getToken(code);

        if (!tokens.access_token) {
            throw new Error('Failed to get access token from Google OAuth');
        }

        return {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || undefined,
            expiry_date: tokens.expiry_date || undefined,
        };
    }

    /**
     * Get authorization URL
     */
    getAuthorizationUrl(state?: string): string {
        const url = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events',
                'https://www.googleapis.com/auth/userinfo.email',
            ],
            prompt: 'consent',
            state,
        });
        return url;
    }
}
