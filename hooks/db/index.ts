import { afterAccountCreationHook, beforeAccountCreationHook } from './account';
import { beforeUserCreationHook, afterUserCreationHook } from './user';
import { beforeSessionCreationHook, afterSessionCreationHook } from './session';

/**
 * User creation hooks
 */
export const userHooks = {
    create: {
        before: beforeUserCreationHook,
        after: afterUserCreationHook,
    },
};

/**
 * Account creation hooks
 */
export const accountHooks = {
    create: {
        before: beforeAccountCreationHook,
        after: afterAccountCreationHook,
    },
};

/**
 * Session creation hooks
 */
export const sessionHooks = {
    create: {
        before: beforeSessionCreationHook,
        after: afterSessionCreationHook,
    },
};
