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
            console.log(`[API_CLIENT] Making request to: ${url}`);

            const response = await fetch(url, {
                ...options,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
            });

            console.log(`[API_CLIENT] Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.log(`[API_CLIENT] Error response:`, errorData);
                return {
                    error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
                    success: false,
                };
            }

            const data = await response.json();
            console.log(`[API_CLIENT] Success response:`, data);
            return {
                data,
                success: true,
            };
        } catch (error) {
            console.error(`[API_CLIENT] Network error:`, error);
            return {
                error: error instanceof Error ? error.message : 'Network error',
                success: false,
            };
        }
    }

    /**
     * Calendar API methods
     */

    /**
     * Get user's calendar connections
     * @returns Promise with calendar connections data
     */
    async getCalendarConnections() {
        return this.request('/calendar');
    }

    /**
     * Get user's calendar accounts with their calendars
     * @returns Promise with calendar accounts data
     */
    async getCalendarAccounts() {
        return this.request('/calendar/accounts');
    }

    /**
     * Sync a specific calendar connection
     * @param connectionId - The calendar connection ID to sync
     * @returns Promise with sync result
     */
    // async syncCalendar(connectionId: string) {
    //     return this.request(`/calendar/${connectionId}/sync`, {
    //         method: 'POST',
    //     });
    // }

    /**
     * Sync all calendar connections for the user
     * @returns Promise with sync results for all calendars
     */
    async refreshCalendars() {
        return this.request('/calendar/refresh', {
            method: 'POST',
        });
    }

    /**
     * Update a calendar connection's settings
     * @param connectionId - The calendar connection ID to update
     * @param data - The update data (isPrimary, includeInAvailability, etc.)
     * @returns Promise with update result
     */
    async updateCalendarConnection(connectionId: string, data: Record<string, unknown>) {
        return this.request(`/calendar/${connectionId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete a calendar account and all its connections
     * @param accountId - The account ID to delete
     * @returns Promise with deletion result
     */
    async deleteCalendarAccount(accountId: string) {
        return this.request('/calendar', {
            method: 'DELETE',
            body: JSON.stringify({ accountId }),
        });
    }

    /**
     * Preferences API methods
     */

    /**
     * Get user preferences (creates default if none exist)
     * @returns Promise with user preferences data
     */
    async getPreferences() {
        return this.request('/preferences');
    }

    /**
     * Create default user preferences
     * @param data - Preference data (not used, defaults are created)
     * @returns Promise with created preferences
     */
    async createPreferences(data: Record<string, unknown>) {
        return this.request('/preferences', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Update user preferences
     * @param data - The preference fields to update
     * @returns Promise with updated preferences
     */
    async updatePreferences(data: Record<string, unknown>) {
        return this.request('/preferences', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    /**
     * Update user preferences document
     * @param data - The preference document to update
     * @returns Promise with updated preferences
     */
    async updatePreferencesDocument(data: Record<string, unknown>) {
        return this.request('/preferences/update-document', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    /**
     * Generate preferences document
     * @returns Promise with generated document
     */
    async generatePreferencesDocument() {
        return this.request('/preferences/generate-document', {
            method: 'POST',
        });
    }

    /**
     * Delete user preferences
     * @returns Promise with deletion result
     */
    async deletePreferences() {
        return this.request('/preferences', {
            method: 'DELETE',
        });
    }

    /**
     * Primary management API methods
     */

    /**
     * Get available primary email and account options
     * @returns Promise with available primary options
     */
    async getPrimaryOptions() {
        return this.request('/preferences/primary-options');
    }

    /**
     * Update the primary user email
     * @param primaryUserEmailId - The user email ID to set as primary (or null to unset)
     * @returns Promise with updated preferences
     */
    async updatePrimaryEmail(primaryUserEmailId: number | null) {
        return this.request('/preferences/primary-email', {
            method: 'PATCH',
            body: JSON.stringify({ primaryUserEmailId }),
        });
    }

    /**
     * Update the primary calendar account
     * @param primaryAccountId - The account ID to set as primary (or null to unset)
     * @returns Promise with updated preferences
     */
    async updatePrimaryAccount(primaryAccountId: string | null) {
        return this.request('/preferences/primary-account', {
            method: 'PATCH',
            body: JSON.stringify({ primaryAccountId }),
        });
    }

    /**
     * User Emails API methods
     */

    /**
     * Get user's email addresses
     * @returns Promise with user emails data
     */
    async getUserEmails() {
        return this.request('/user-emails');
    }

    /**
     * Add a new email address for the user
     * @param data - Email data with email address and optional isPrimary flag
     * @returns Promise with created email data
     */
    async addUserEmail(data: { email: string; isPrimary?: boolean }) {
        return this.request('/user-emails', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Update a user email's settings
     * @param emailId - The email ID to update (number)
     * @param data - The update data (typically isPrimary flag)
     * @returns Promise with updated email data
     */
    async updateUserEmail(emailId: number, data: Record<string, unknown>) {
        return this.request(`/user-emails/${emailId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete a user email address
     * @param emailId - The email ID to delete (number)
     * @returns Promise with deletion result
     */
    async deleteUserEmail(emailId: number) {
        return this.request(`/user-emails/${emailId}`, {
            method: 'DELETE',
        });
    }

    /**
     * Working Hours API methods
     */

    /**
     * Get user's working hours schedules
     * @returns Promise with working hours data
     */
    async getWorkingHours() {
        return this.request('/working-hours');
    }

    /**
     * Create a new working hours schedule
     * @param data - Working hours data with days array (0-6), startTime, endTime, timezone
     * @returns Promise with created working hours data
     */
    async createWorkingHours(data: {
        days: number[];
        startTime: string;
        endTime: string;
        timezone?: string;
    }) {
        return this.request('/working-hours', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Update a working hours schedule
     * @param workingHoursId - The working hours ID to update (number)
     * @param data - The update data (days, startTime, endTime, timezone, isActive)
     * @returns Promise with updated working hours data
     */
    async updateWorkingHours(workingHoursId: number, data: Record<string, unknown>) {
        return this.request(`/working-hours/${workingHoursId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete a working hours schedule (hard delete - permanently removes)
     * @param workingHoursId - The working hours ID to delete (number)
     * @returns Promise with deletion result
     */
    async deleteWorkingHours(workingHoursId: number) {
        return this.request(`/working-hours/${workingHoursId}`, {
            method: 'DELETE',
        });
    }

    /**
     * Check if user is available at a specific date and time
     * @param date - The date to check (YYYY-MM-DD format)
     * @param time - The time to check (HH:MM format)
     * @returns Promise with availability status and available slots
     */
    async checkUserAvailability(date: string, time: string) {
        const params = new URLSearchParams({ date, time });

        return this.request(`/working-hours/check?${params.toString()}`);
    }
}

export const apiClient = new ApiClient();
export default apiClient;
