import { CalendarConnection, CalendarClientGoogleAccount } from '@/types/calendar';

/**
 * CalendarClient is a class that provides a client for interacting with the calendar API.
 */
export class CalendarClient {
    private baseUrl: string;

    constructor(baseUrl: string = '/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * fetchWithAuth is a private method that fetches data from the calendar API with authentication.
     * @param endpoint - The endpoint to fetch data from.
     * @param options - The options for the fetch request.
     * @returns The response from the calendar API.
     */
    private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get user's calendar connections
     * @returns The user's calendar connections.
     */
    async getConnections(): Promise<CalendarConnection[]> {
        return this.fetchWithAuth('/v1/calendar');
    }

    /**
     * Get user's Google accounts
     * @returns The user's Google accounts.
     */
    async getGoogleAccounts(): Promise<CalendarClientGoogleAccount[]> {
        return this.fetchWithAuth('/v1/calendar/accounts');
    }

    /**
     * Update a calendar connection
     * @param id - The id of the calendar connection to update.
     * @param updates - The updates to apply to the calendar connection.
     */
    async updateConnection(id: number, updates: Partial<CalendarConnection>): Promise<void> {
        await this.fetchWithAuth(`/v1/calendar/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    /**
     * Remove a calendar account and all its connections
     * @param accountId - The id of the account to remove.
     */
    async removeAccount(accountId: string): Promise<void> {
        await this.fetchWithAuth('/v1/calendar', {
            method: 'DELETE',
            body: JSON.stringify({ accountId }),
        });
    }

    /**
     * Sync a specific calendar
     * @param id - The id of the calendar connection to sync.
     */
    async syncConnection(id: number): Promise<void> {
        await this.fetchWithAuth(`/v1/calendar/${id}/sync`, {
            method: 'POST',
        });
    }
}

/**
 * Export a default instance for use in the client
 */
export const calendarClient = new CalendarClient();
