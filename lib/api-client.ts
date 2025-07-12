/**
 * API Client for making authenticated requests
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    success?: boolean;
}

class ApiClient {
    private baseURL: string;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        try {
            const url = `${this.baseURL}${endpoint}`;

            const response = await fetch(url, {
                ...options,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
                    success: false,
                };
            }

            const data = await response.json();
            return {
                data,
                success: true,
            };
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Network error',
                success: false,
            };
        }
    }

    // Calendar API methods
    async getCalendarConnections() {
        return this.request('/calendar');
    }

    async getCalendarAccounts() {
        return this.request('/calendar/accounts');
    }

    async syncCalendar(connectionId: string) {
        return this.request(`/calendar/${connectionId}/sync`, {
            method: 'POST',
        });
    }

    async updateCalendarConnection(connectionId: string, data: Record<string, unknown>) {
        return this.request(`/calendar/${connectionId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteCalendarAccount(accountId: string) {
        return this.request('/calendar', {
            method: 'DELETE',
            body: JSON.stringify({ accountId }),
        });
    }

    // Preferences API methods
    async getPreferences() {
        return this.request('/preferences');
    }

    async createPreferences(data: Record<string, unknown>) {
        return this.request('/preferences', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updatePreferences(data: Record<string, unknown>) {
        return this.request('/preferences', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deletePreferences() {
        return this.request('/preferences', {
            method: 'DELETE',
        });
    }

    // Primary management API methods
    async getPrimaryOptions() {
        return this.request('/preferences/primary-options');
    }

    async updatePrimaryEmail(primaryUserEmailId: number | null) {
        return this.request('/preferences/primary-email', {
            method: 'PATCH',
            body: JSON.stringify({ primaryUserEmailId }),
        });
    }

    async updatePrimaryAccount(primaryAccountId: string | null) {
        return this.request('/preferences/primary-account', {
            method: 'PATCH',
            body: JSON.stringify({ primaryAccountId }),
        });
    }

    // User Emails API methods
    async getUserEmails() {
        return this.request('/user-emails');
    }

    async addUserEmail(data: { email: string; isPrimary?: boolean }) {
        return this.request('/user-emails', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateUserEmail(emailId: string, data: Record<string, unknown>) {
        return this.request(`/user-emails/${emailId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteUserEmail(emailId: string) {
        return this.request(`/user-emails/${emailId}`, {
            method: 'DELETE',
        });
    }

    // Availability API methods
    async getAvailability() {
        return this.request('/availability');
    }

    async createAvailability(data: Record<string, unknown>) {
        return this.request('/availability', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateAvailability(availabilityId: string, data: Record<string, unknown>) {
        return this.request(`/availability/${availabilityId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteAvailability(availabilityId: string) {
        return this.request(`/availability/${availabilityId}`, {
            method: 'DELETE',
        });
    }

    async checkAvailability(date: string, time: string, timezone?: string) {
        const params = new URLSearchParams({ date, time });
        if (timezone) params.append('timezone', timezone);

        return this.request(`/availability/check?${params.toString()}`);
    }
}

export const apiClient = new ApiClient();
export default apiClient;
