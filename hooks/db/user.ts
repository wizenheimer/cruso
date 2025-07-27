import { UserBeforeCreateHook, UserAfterCreateHook } from './types';
import { setAllowedListEntry } from '@/db/queries/allowed-list';

/**
 * Hooks triggered before user creation
 */
export const beforeUserCreationHook = (async (user, context) => {
    if (context && context.context) {
        context.context.isNewUser = true;
    }
}) as UserBeforeCreateHook;

/**
 * Hooks triggered after user creation
 */
export const afterUserCreationHook = (async (user) => {
    // User created successfully
    try {
        // Add the user to the allowed list
        await setAllowedListEntry(user.email, true);
    } catch (error) {
        console.warn('error adding user to allowed list:', error);
    }
}) as UserAfterCreateHook;
