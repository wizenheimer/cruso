import { SessionAfterCreateHook, SessionBeforeCreateHook } from './types';

/**
 * Hooks triggered before session creation
 */
export const beforeSessionCreationHook = (async (session) => {
    // Session creation started
}) as SessionBeforeCreateHook;

/**
 * Hooks triggered after session creation
 */
export const afterSessionCreationHook = (async (session) => {
    // Session created successfully
}) as SessionAfterCreateHook;
