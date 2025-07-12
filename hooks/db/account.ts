import { AccountAfterCreateHook, AccountBeforeCreateHook } from './types';
import {
    handleEmailConnection,
    handleGoogleCalendarConnection,
    handleNewUserAvailabilities,
    handleNewUserPreferences,
} from './utils';

/**
 * Hooks triggered before account creation
 */
export const beforeAccountCreationHook = (async (account) => {
    // Account creation started
}) as AccountBeforeCreateHook;

/**
 * Hooks triggered after account creation
 */
export const afterAccountCreationHook = (async (account, context) => {
    // Handle Google calendar connection
    if (account.providerId === 'google') {
        await handleGoogleCalendarConnection(account, context);

        // Handle email connection - adds the connected calendar email to the user emails table
        await handleEmailConnection(account, context);

        // Handle new user preferences - adds the connected calendar email to the user preferences table if the user is newly created
        const isNewUser = context?.context?.isNewUser || false;
        if (isNewUser) {
            // Add default availability
            await handleNewUserAvailabilities(account, context);

            // Add default preferences
            await handleNewUserPreferences(account, context);
        }
    }
}) as AccountAfterCreateHook;
