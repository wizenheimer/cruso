import { UserBeforeCreateHook, UserAfterCreateHook } from './types';

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
}) as UserAfterCreateHook;
