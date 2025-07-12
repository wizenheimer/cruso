import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    fetchOptions: {
        credentials: 'include',
    },
});

/**
 * Get the current user's primary preferences
 * This is a convenience method for getting primary email and account info
 */
export const getPrimaryPreferences = async () => {
    try {
        const response = await fetch('/api/preferences', {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return {
            primaryEmail: data.primaryUserEmail,
            primaryAccount: data.primaryAccount,
        };
    } catch (error) {
        console.error('Error fetching primary preferences:', error);
        return null;
    }
};
