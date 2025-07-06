import { OAuth2Client, Credentials } from 'google-auth-library';
import { calendar_v3, google } from 'googleapis';

// OAuth credentials interface
interface OAuthCredentials {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
}

class GoogleAuthManager {
    private oauth2Client: OAuth2Client;

    constructor() {
        this.oauth2Client = new OAuth2Client();
    }

    private async loadCredentialsFromEnv(): Promise<OAuthCredentials> {
        const clientId = process.env['GOOGLE_CLIENT_ID'];
        const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];
        const redirectUri =
            process.env['GOOGLE_REDIRECT_URI'] || 'http://localhost:3000/api/auth/google/callback';

        if (!clientId || !clientSecret) {
            throw new Error(
                'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required',
            );
        }

        return {
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uris: [redirectUri],
        };
    }

    async initializeOAuth2Client(): Promise<OAuth2Client> {
        try {
            const credentials = await this.loadCredentialsFromEnv();

            // Only create new client if not already initialized
            if (!this.oauth2Client || !this.oauth2Client._clientId) {
                this.oauth2Client = new OAuth2Client({
                    clientId: credentials.client_id,
                    clientSecret: credentials.client_secret,
                    redirectUri: credentials.redirect_uris[0]!,
                });
            }

            return this.oauth2Client;
        } catch (error) {
            throw new Error(
                `Error initializing OAuth client: ${
                    error instanceof Error ? error.message : 'Unknown error'
                }`,
            );
        }
    }

    async validateTokens(): Promise<boolean> {
        if (!this.oauth2Client.credentials?.access_token) {
            return false;
        }

        const expiryDate = this.oauth2Client.credentials.expiry_date;
        const isExpired = expiryDate ? Date.now() >= expiryDate - 5 * 60 * 1000 : false;

        if (isExpired && this.oauth2Client.credentials.refresh_token) {
            try {
                const response = await this.oauth2Client.refreshAccessToken();
                this.oauth2Client.setCredentials(response.credentials);
                return true;
            } catch (error) {
                return false;
            }
        }

        return true;
    }

    generateAuthUrl(
        scopes: string[] = [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ],
    ): string {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
        });
    }

    async getTokensFromCode(code: string): Promise<Credentials> {
        const { tokens } = await this.oauth2Client.getToken(code);
        return tokens;
    }

    getCalendarAPI(): calendar_v3.Calendar {
        return google.calendar({ version: 'v3', auth: this.oauth2Client });
    }

    async getUserInfo() {
        console.log('Getting user info - checking credentials:', {
            hasAccessToken: !!this.oauth2Client.credentials?.access_token,
            hasRefreshToken: !!this.oauth2Client.credentials?.refresh_token,
            expiryDate: this.oauth2Client.credentials?.expiry_date,
        });

        const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
        const { data } = await oauth2.userinfo.get();
        return data;
    }

    // Set credentials for a specific user from database tokens
    setUserCredentials(accessToken: string, refreshToken?: string, expiryDate?: Date) {
        const credentials: Credentials = {
            access_token: accessToken,
            refresh_token: refreshToken || undefined,
            expiry_date: expiryDate?.getTime() || undefined,
        };

        console.log('Setting credentials:', {
            hasAccessToken: !!credentials.access_token,
            hasRefreshToken: !!credentials.refresh_token,
            expiryDate: credentials.expiry_date,
        });

        this.oauth2Client.setCredentials(credentials);

        // Verify credentials were set
        const setCredentials = this.oauth2Client.credentials;
        console.log('Credentials set on client:', {
            hasAccessToken: !!setCredentials.access_token,
            hasRefreshToken: !!setCredentials.refresh_token,
            expiryDate: setCredentials.expiry_date,
        });
    }

    // Get current credentials
    getCurrentCredentials(): Credentials {
        return this.oauth2Client.credentials;
    }
}

// Singleton instance
export const googleAuth = new GoogleAuthManager();
