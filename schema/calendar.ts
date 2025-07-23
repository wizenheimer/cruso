import { z } from 'zod';

// Google Account Schema
export const GoogleAccountSchema = z.object({
    id: z.string(),
    accountId: z.string(),
    providerId: z.string(),
    accessToken: z.string().nullable().optional(),
    userId: z.string(),
});

// User Profile Schema
export const UserProfileSchema = z.object({
    email: z.string().email(),
    name: z.string(),
});

// Google Calendar Schema
export const GoogleCalendarSchema = z.object({
    id: z.string(),
    summary: z.string(),
    timeZone: z.string().optional(),
    primary: z.boolean().optional(),
});

// Connection Manager Schema
export const ConnectionManagerParamsSchema = z.object({
    userId: z.string(),
    accountId: z.string(),
    googleAccountId: z.string(),
    googleEmail: z.string().email(),
});

// Google Calendar Connection Schema
export const GoogleCalendarConnectionParamsSchema = z.object({
    userId: z.string(),
    account: GoogleAccountSchema,
    profile: UserProfileSchema,
});

// OAuth Token Schema
export const OAuthTokensSchema = z.object({
    access_token: z.string(),
    refresh_token: z.string().optional(),
    expiry_date: z.number().optional(),
});

// Sync Result Schema
export const CalendarSyncResultSchema = z.object({
    accountSynced: z.number(),
    errors: z.array(z.string()),
});

// Refresh Result Schema
export const CalendarRefreshResultSchema = z.object({
    accountsSynced: z.number(),
    calendarsSynced: z.number(),
    errors: z.array(z.string()),
});

// Calendar Client Schemas
export const CalendarConnectionSchema = z.object({
    id: z.number(),
    accountId: z.string(),
    googleAccountId: z.string(),
    googleEmail: z.string().email(),
    calendarName: z.string(),
    calendarId: z.string(),
    isPrimary: z.boolean(),
    includeInAvailability: z.boolean(),
    isActive: z.boolean(),
    lastSyncAt: z.string(),
    syncStatus: z.enum(['active', 'error', 'paused']),
    errorMessage: z.string().optional(),
});

export const CalendarClientGoogleAccountSchema = z.object({
    accountId: z.string(),
    googleAccountId: z.string(),
    email: z.string().email(),
    calendarCount: z.number(),
    calendars: z.array(
        z.object({
            id: z.number(),
            calendarId: z.string(),
            name: z.string(),
            isPrimary: z.boolean(),
            includeInAvailability: z.boolean(),
            syncStatus: z.string(),
        }),
    ),
});

export const AvailabilityRequestSchema = z.object({
    startTime: z.string(),
    endTime: z.string(),
});

export const AvailabilityResponseSchema = z.object({
    events: z.array(
        z.object({
            id: z.string(),
            summary: z.string(),
            start: z.string(),
            end: z.string(),
            calendarId: z.string(),
            calendarName: z.string(),
        }),
    ),
    calendarsChecked: z.number(),
});
