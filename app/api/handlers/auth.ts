// import { db } from '@/db';
// import { calendarConnections } from '@/db/schema/calendars';
// import { account } from '@/db/schema/auth';
// import { eq, and } from 'drizzle-orm';
// import { Context } from 'hono';
// import { ConnectionManager } from '@/services/calendar/connection';
// import { getUser } from './calendar';

// /**
//  * Extract email address from Google ID token
//  * @param googleIdToken - The Google ID token to extract email from
//  * @returns The email address or null if extraction fails
//  */
// function extractEmailFromGoogleToken(googleIdToken?: string | null): string | null {
//     console.log(' [POST_OAUTH] Extracting email from Google ID token...');
//     console.log(' [POST_OAUTH] ID token exists:', !!googleIdToken);

//     if (!googleIdToken) {
//         console.log(' [POST_OAUTH] No ID token provided');
//         return null;
//     }

//     try {
//         // Decode the JWT payload (base64 decode the middle part)
//         const jwtPayloadSection = googleIdToken.split('.')[1];
//         const decodedTokenPayload = JSON.parse(atob(jwtPayloadSection));
//         const extractedEmail = decodedTokenPayload.email || null;

//         console.log(' [POST_OAUTH] Successfully extracted email:', extractedEmail);
//         console.log(' [POST_OAUTH] Full token payload keys:', Object.keys(decodedTokenPayload));

//         return extractedEmail;
//     } catch (emailExtractionError) {
//         console.error(' [POST_OAUTH] Error extracting email from ID token:', emailExtractionError);
//         return null;
//     }
// }

// /**
//  * Handle the post-OAuth sync request to automatically sync newly connected Google accounts
//  * @param requestContext - The Hono context object containing request data
//  * @returns JSON response with sync results or error message
//  */
// export async function handlePostOAuthSync(requestContext: Context) {
//     try {
//         const authenticatedUser = getUser(requestContext);
//         console.log('\n [POST_OAUTH] Post-OAuth sync requested for user:', authenticatedUser.id);

//         // Get all Google accounts for the user that don't have calendar connections yet
//         console.log(' [POST_OAUTH] Fetching all Google accounts for user...');
//         const userGoogleAccounts = await db
//             .select()
//             .from(account)
//             .where(and(eq(account.userId, authenticatedUser.id), eq(account.providerId, 'google')));

//         console.log(' [POST_OAUTH] Found Google accounts:', userGoogleAccounts.length);
//         console.log(
//             ' [POST_OAUTH] Account details:',
//             userGoogleAccounts.map((googleAccount) => ({
//                 id: googleAccount.id,
//                 accountId: googleAccount.accountId,
//                 hasAccessToken: !!googleAccount.accessToken,
//                 hasIdToken: !!googleAccount.idToken,
//             })),
//         );

//         let syncedAccountsCount = 0;
//         let totalCalendarsCount = 0;

//         for (const googleAccountData of userGoogleAccounts) {
//             console.log(`\n [POST_OAUTH] Processing account: ${googleAccountData.id}`);

//             // Check if this account already has calendar connections
//             const existingCalendarConnections = await db
//                 .select()
//                 .from(calendarConnections)
//                 .where(
//                     and(
//                         eq(calendarConnections.accountId, googleAccountData.id),
//                         eq(calendarConnections.isActive, true),
//                     ),
//                 )
//                 .limit(1);

//             if (existingCalendarConnections.length > 0) {
//                 console.log(
//                     ` [POST_OAUTH] Account ${googleAccountData.id} already has calendar connections, skipping`,
//                 );
//                 continue;
//             }

//             console.log(' [POST_OAUTH] Syncing new account:', googleAccountData.id);

//             if (!googleAccountData.accessToken) {
//                 console.error(' [POST_OAUTH] No access token for account:', googleAccountData.id);
//                 continue;
//             }

//             if (!googleAccountData.accountId) {
//                 console.error(' [POST_OAUTH] No Google account ID for account:', googleAccountData.id);
//                 continue;
//             }

//             try {
//                 console.log(' [POST_OAUTH] Starting Google email extraction...');
//                 // Extract Google email from ID token
//                 const extractedGoogleEmail = extractEmailFromGoogleToken(googleAccountData.idToken);

//                 console.log(' [POST_OAUTH] Email extraction result:', {
//                     extractedEmail: extractedGoogleEmail,
//                     fallbackAccountId: googleAccountData.accountId,
//                     willUse: extractedGoogleEmail || googleAccountData.accountId,
//                 });

//                 console.log(' [POST_OAUTH] Creating ConnectionManager...');
//                 // Use the ConnectionManager to sync calendars
//                 const calendarConnectionManager = new ConnectionManager({
//                     userId: authenticatedUser.id,
//                     accountId: googleAccountData.id,
//                     googleAccountId: googleAccountData.accountId,
//                     googleEmail: extractedGoogleEmail || googleAccountData.accountId, // Use Google email or fallback to account ID
//                 });

//                 console.log(' [POST_OAUTH] Starting calendar sync for account:', googleAccountData.id);
//                 await calendarConnectionManager.syncUserCalendars();

//                 // Count the calendars that were synced
//                 console.log(' [POST_OAUTH] Counting synced calendars...');
//                 const newlySyncedConnections = await db
//                     .select()
//                     .from(calendarConnections)
//                     .where(
//                         and(
//                             eq(calendarConnections.accountId, googleAccountData.id),
//                             eq(calendarConnections.isActive, true),
//                         ),
//                     );

//                 totalCalendarsCount += newlySyncedConnections.length;
//                 syncedAccountsCount++;

//                 console.log(
//                     ` [POST_OAUTH] Successfully synced ${newlySyncedConnections.length} calendars for account ${googleAccountData.id}`,
//                 );
//             } catch (calendarSyncError) {
//                 console.error(
//                     ' [POST_OAUTH] Error syncing calendars for account:',
//                     googleAccountData.id,
//                     calendarSyncError,
//                 );
//             }
//         }

//         console.log(
//             `\n [POST_OAUTH] Post-OAuth sync completed. Synced ${syncedAccountsCount} accounts with ${totalCalendarsCount} calendars`,
//         );

//         return requestContext.json({
//             success: true,
//             accountsSynced: syncedAccountsCount,
//             calendarsSynced: totalCalendarsCount,
//         });
//     } catch (postOAuthSyncError) {
//         console.error(' [POST_OAUTH] Error in post-OAuth sync:', postOAuthSyncError);
//         return requestContext.json({ error: 'Failed to sync calendars' }, 500);
//     }
// }
