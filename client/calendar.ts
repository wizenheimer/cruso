/**
 * CalendarConnection is the response from the calendar API when getting calendar connections.
 */
export interface CalendarConnection {
    id: number;
    accountId: string;
    googleAccountId: string;
    googleEmail: string;
    calendarName: string;
    calendarId: string;
    isPrimary: boolean;
    includeInAvailability: boolean;
    isActive: boolean;
    lastSyncAt: string;
    syncStatus: 'active' | 'error' | 'paused';
    errorMessage?: string;
}

/**
 * GoogleAccount is the response from the calendar API when getting Google accounts.
 */
export interface GoogleAccount {
    accountId: string;
    googleAccountId: string;
    email: string;
    calendarCount: number;
    calendars: Array<{
        id: number;
        calendarId: string;
        name: string;
        isPrimary: boolean;
        includeInAvailability: boolean;
        syncStatus: string;
    }>;
}

/**
 * AvailabilityRequest is the request body for checking availability.
 */
export interface AvailabilityRequest {
    startTime: string;
    endTime: string;
}

/**
 * AvailabilityResponse is the response from the calendar API when checking availability.
 */
export interface AvailabilityResponse {
    events: Array<{
        id: string;
        summary: string;
        start: string;
        end: string;
        calendarId: string;
        calendarName: string;
    }>;
    calendarsChecked: number;
}

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
    async getGoogleAccounts(): Promise<GoogleAccount[]> {
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

    /**
     * Check availability across all calendars
     * @param request - The request body for checking availability.
     * @returns The response from the calendar API when checking availability.
     */
    async checkAvailability(request: AvailabilityRequest): Promise<AvailabilityResponse> {
        return this.fetchWithAuth('/v1/calendar/availability', {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }
}

/**
 * Export a default instance for use in the client
 */
export const calendarClient = new CalendarClient();
