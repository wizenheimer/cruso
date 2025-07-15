/**
 * Cookie Prefix for Better Auth
 * This is used to prevent conflicts with other cookies
 * Added separately to prevent edge runtime issues
 * The error was occurring because middleware was importing authCookiePrefix from @/lib/auth, which in turn imported ConnectionManager from the calendar service.
 * The ConnectionManager uses googleapis and google-auth-library, which are Node.js modules that aren't compatible with the Edge Runtime.
 * https://nextjs.org/docs/app/building-your-application/routing/middleware#edge-runtime-compatibility
 * https://www.better-auth.com/docs/concepts/cookies
 */
export const authCookiePrefix = process.env.AUTH_COOKIE_PREFIX || 'cruso';
