import { z } from 'zod';
import {
    UserProfileSchema,
    GoogleCalendarSchema,
    ConnectionManagerParamsSchema,
    GoogleCalendarConnectionParamsSchema,
    OAuthTokensSchema,
    CalendarSyncResultSchema,
    CalendarRefreshResultSchema,
    CalendarConnectionSchema,
    CalendarClientGoogleAccountSchema,
    AvailabilityRequestSchema,
    AvailabilityResponseSchema,
} from '@/schema/calendar';

// Inferred Types from Zod Schemas

/**
 * User profile information from authentication providers.
 * Used in calendar connection setup to identify the user's email and name.
 * @see services/calendar/connection.ts - Used in GoogleCalendarConnectionParams
 */
export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * Google Calendar metadata from the Google Calendar API.
 * Represents a calendar's basic information like id, summary, and timezone.
 * Used in calendar synchronization to store available calendars.
 * @see services/calendar/connection.ts - Used in fetchCalendarsFromGoogle and storeCalendars
 */
export type GoogleCalendar = z.infer<typeof GoogleCalendarSchema>;

/**
 * Parameters required to initialize a calendar connection manager.
 * Contains user and account identification information from Better Auth.
 * Used when creating new calendar connections for a user.
 * @see services/calendar/connection.ts - Used in ConnectionManager constructor
 */
export type ConnectionManagerParams = z.infer<typeof ConnectionManagerParamsSchema>;

/**
 * Parameters for handling Google calendar connection setup.
 * Contains user, account, and profile information needed for OAuth flow.
 * Used during the initial calendar connection process.
 * @see services/calendar/connection.ts - Used in handleGoogleCalendarConnection
 * @see hooks/db/account.ts - Used in account creation flow
 */
export type GoogleCalendarConnectionParams = z.infer<typeof GoogleCalendarConnectionParamsSchema>;

/**
 * OAuth tokens received from Google authentication.
 * Contains access token, refresh token, and expiry information.
 * Used for authenticating API requests to Google Calendar.
 * @see services/calendar/auth.ts - Used in GoogleAuthManager
 */
export type OAuthTokens = z.infer<typeof OAuthTokensSchema>;

/**
 * Result of calendar synchronization operation.
 * Contains count of synced accounts and any errors encountered.
 * Used to report sync status and handle errors.
 * @see services/calendar/service.ts - Used in syncCalendars method
 * @see services/calendar/calendar.ts - Used in GoogleCalendarService
 */
export type CalendarSyncResult = z.infer<typeof CalendarSyncResultSchema>;

/**
 * Result of calendar refresh operation.
 * Contains counts of synced accounts and calendars, plus any errors.
 * Used to report refresh status and handle errors.
 * @see services/calendar/service.ts - Used in refreshCalendars method
 * @see services/calendar/calendar.ts - Used in GoogleCalendarService
 */
export type CalendarRefreshResult = z.infer<typeof CalendarRefreshResultSchema>;

// Calendar Client Types

/**
 * Calendar connection information for the client.
 * Represents a user's connected calendar with sync status and settings.
 * Used in the dashboard to display and manage calendar connections.
 * @see client/calendar.ts - Used in CalendarClient methods
 * @see hooks/client/calendar.ts - Used in useCalendarConnections hook
 * @see components/dashboard/CalendarSection.tsx - Used in UI components
 */
export type CalendarConnection = z.infer<typeof CalendarConnectionSchema>;

/**
 * Google account information for the calendar client.
 * Contains account details and associated calendars for display in the UI.
 * Used to show users their connected Google accounts and calendars.
 * @see client/calendar.ts - Used in getGoogleAccounts method
 * @see hooks/client/calendar.ts - Used in useGoogleAccounts hook
 * @see components/dashboard/CalendarSection.tsx - Used in UI components
 */
export type CalendarClientGoogleAccount = z.infer<typeof CalendarClientGoogleAccountSchema>;

/**
 * Request parameters for checking calendar availability.
 * Contains start and end times for availability checking.
 * Used when users want to check their availability for a specific time period.
 * @see client/calendar.ts - Used in checkAvailability method
 * @see hooks/client/calendar.ts - Used in useAvailabilityCheck hook
 */
export type AvailabilityRequest = z.infer<typeof AvailabilityRequestSchema>;

/**
 * Response from calendar availability check.
 * Contains events found during the specified time period and count of calendars checked.
 * Used to display conflicts and availability information to users.
 * @see client/calendar.ts - Used in checkAvailability method
 * @see hooks/client/calendar.ts - Used in useAvailabilityCheck hook
 */
export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;
