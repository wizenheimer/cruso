import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from '@/db';
import { account } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';

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
        console.log('┌─ [AUTH_MANAGER] Getting authenticated client...', { accountId });

        // Fetch account data from database
        console.log('├─ [AUTH_MANAGER] Fetching account data from database...');
        const accountData = await db
            .select()
            .from(account)
            .where(eq(account.id, accountId))
            .limit(1);

        console.log('├─ [AUTH_MANAGER] Account query result:', { found: accountData.length });
        if (accountData.length === 0) {
            console.log('└─ [AUTH_MANAGER] Account not found');
            throw new Error('Account not found');
        }

        const acc = accountData[0];
        console.log('├─ [AUTH_MANAGER] Account tokens status:', {
            hasAccessToken: !!acc.accessToken,
            hasRefreshToken: !!acc.refreshToken,
            expiresAt: acc.accessTokenExpiresAt,
        });

        if (!acc.accessToken || !acc.refreshToken) {
            console.log('└─ [AUTH_MANAGER] No tokens available for this account');
            throw new Error('No tokens available for this account');
        }

        // Create a new OAuth2 client instance for this specific account
        console.log('├─ [AUTH_MANAGER] Creating OAuth2 client...');
        const authClient = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID!,
            process.env.GOOGLE_CLIENT_SECRET!,
            process.env.GOOGLE_REDIRECT_URI,
        );

        // Set the credentials
        console.log('├─ [AUTH_MANAGER] Setting credentials...');
        authClient.setCredentials({
            access_token: acc.accessToken,
            refresh_token: acc.refreshToken,
            expiry_date: acc.accessTokenExpiresAt?.getTime(),
        });

        // Set up automatic token refresh
        console.log('├─ [AUTH_MANAGER] Setting up token refresh handler...');
        authClient.on('tokens', async (tokens) => {
            console.log('├─ [AUTH_MANAGER] Tokens refreshed, updating database...');
            // Update tokens in database when they're refreshed
            await db
                .update(account)
                .set({
                    accessToken: tokens.access_token!,
                    accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                    updatedAt: new Date(),
                })
                .where(eq(account.id, accountId));
            console.log('├─ [AUTH_MANAGER] Database updated with new tokens');
        });

        // Force a token refresh if needed
        console.log('├─ [AUTH_MANAGER] Validating access token...');
        const tokenInfo = await authClient.getAccessToken();
        if (!tokenInfo.token) {
            console.log('└─ [AUTH_MANAGER] Failed to get access token');
            throw new Error('Failed to get access token');
        }

        console.log('└─ [AUTH_MANAGER] Successfully created authenticated client');
        return authClient;
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForTokens(code: string): Promise<{
        access_token: string;
        refresh_token?: string;
        expiry_date?: number;
    }> {
        console.log('┌─ [AUTH_MANAGER] Exchanging authorization code for tokens...');
        console.log('├─ [AUTH_MANAGER] Code provided:', !!code);

        const { tokens } = await this.oauth2Client.getToken(code);
        console.log('├─ [AUTH_MANAGER] Token exchange response:', {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            hasExpiryDate: !!tokens.expiry_date,
        });

        if (!tokens.access_token) {
            console.log('└─ [AUTH_MANAGER] Failed to get access token from Google OAuth');
            throw new Error('Failed to get access token from Google OAuth');
        }

        console.log('└─ [AUTH_MANAGER] Successfully exchanged code for tokens');
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
        console.log('┌─ [AUTH_MANAGER] Generating authorization URL...', { state });
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
        console.log('└─ [AUTH_MANAGER] Generated authorization URL');
        return url;
    }
}
