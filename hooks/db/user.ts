import { UserBeforeCreateHook, UserAfterCreateHook } from './types';
import { getAllowedListEntry, setAllowedListEntry } from '@/db/queries/allowed-list';
import { ExchangeService } from '@/services/exchange';
import { checkDisallowedEmail } from '@/lib/email';

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
    const entry = await getAllowedListEntry(user.email);
    const isAllowedEntry = entry?.isAllowed || false;
    const isAllowedDomain = !checkDisallowedEmail(user.email);
    const exchangeService = await ExchangeService.getInstance();
    try {
        // Send a welcome email to the user
        if (isAllowedEntry || isAllowedDomain) {
            await setAllowedListEntry(user.email, true);
            await exchangeService.sendWelcomeEmail(user.id, user.email);
        } else {
            await setAllowedListEntry(user.email, false);
            await exchangeService.sendWaitlistEmail(user.id, user.email);
        }
    } catch (error) {
        console.warn('error on afterUserCreationHook:', error);
    }
}) as UserAfterCreateHook;
