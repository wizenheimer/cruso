import {
    WELCOME_EMAIL_SUBJECT,
    WELCOME_EMAIL_BODY,
    WAITLIST_EMAIL_SUBJECT,
    WAITLIST_EMAIL_BODY,
} from '@/constants/email';
import { UserBeforeCreateHook, UserAfterCreateHook } from './types';
import { getAllowedListEntry, setAllowedListEntry } from '@/db/queries/allowed-list';
import { checkDisallowedEmail } from '@/lib/email';
import { EmailService } from '@/services/email';

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
    const emailService = EmailService.getInstance();
    // const exchangeService = await ExchangeService.getInstance();
    try {
        // Send a welcome email to the user
        if (isAllowedEntry || isAllowedDomain) {
            await setAllowedListEntry(user.email, true);
            await emailService.sendEmail({
                recipients: [user.email],
                subject: WELCOME_EMAIL_SUBJECT,
                body: WELCOME_EMAIL_BODY,
            });
            // await exchangeService.sendWelcomeEmail(user.id, user.email);
        } else {
            await setAllowedListEntry(user.email, false);
            // await exchangeService.sendWaitlistEmail(user.id, user.email);
            await emailService.sendEmail({
                recipients: [user.email],
                subject: WAITLIST_EMAIL_SUBJECT,
                body: WAITLIST_EMAIL_BODY,
            });
        }
    } catch (error) {
        console.warn('error on afterUserCreationHook:', error);
    }
}) as UserAfterCreateHook;
