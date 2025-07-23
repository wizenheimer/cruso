import { calendar_v3 } from 'googleapis';

// Calendar Event Types
export interface CalendarEvent {
    id?: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    attendees?: Array<{
        email: string;
        displayName?: string;
        responseStatus?: string;
    }>;
    location?: string;
    conferenceData?: calendar_v3.Schema$ConferenceData;
    reminders?: {
        useDefault?: boolean;
        overrides?: Array<{
            method: string;
            minutes: number;
        }>;
    };
}

// Calendar Info Types
export interface CalendarInfo {
    id: string;
    summary: string;
    description?: string;
    primary?: boolean;
    accessRole?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    timeZone?: string;
    syncStatus: 'active' | 'error' | 'paused';
    lastSyncAt?: string;
    googleEmail: string;
}

// Availability Types
export interface AvailabilityResult {
    isAvailable: boolean;
    busySlots: Array<{ start: string; end: string }>;
    events: Array<{
        id: string;
        summary: string;
        start: string;
        end: string;
        calendarId: string;
        calendarName: string;
    }>;
}

// Google Account Types
export interface GoogleAccount {
    id: string;
    accountId: string;
    providerId: string;
    accessToken?: string | null;
    userId: string;
}

// User Profile Types
export interface UserProfile {
    email: string;
    name: string;
}

// Google Calendar Types
export interface GoogleCalendar {
    id: string;
    summary: string;
    timeZone?: string;
    primary?: boolean;
}

// Connection Manager Types
export interface ConnectionManagerParams {
    userId: string;
    accountId: string;
    googleAccountId: string;
    googleEmail: string;
}

export interface GoogleCalendarConnectionParams {
    userId: string;
    account: GoogleAccount;
    profile: UserProfile;
}

// Calendar Service Options Types
export interface GetEventsOptions {
    maxResults?: number;
    pageToken?: string;
    q?: string;
    showDeleted?: boolean;
    singleEvents?: boolean;
    orderBy?: 'startTime' | 'updated';
}

export interface CreateEventOptions {
    sendUpdates?: 'all' | 'externalOnly' | 'none';
    conferenceDataVersion?: number;
}

export interface UpdateEventOptions {
    sendUpdates?: 'all' | 'externalOnly' | 'none';
}

export interface DeleteEventOptions {
    sendUpdates?: 'all' | 'externalOnly' | 'none';
}

export interface CheckAvailabilityOptions {
    includeCalendarIds?: string[];
    excludeCalendarIds?: string[];
    timeZone?: string;
}

// Sync Result Types
export interface SyncResult {
    success: number;
    errors: string[];
}

export interface CalendarListSyncResult {
    accountsSynced: number;
    calendarsSynced: number;
    errors: string[];
}

// Watch Calendar Types
export interface WatchCalendarResult {
    resourceId: string;
    expiration: number;
}

// OAuth Token Types
export interface OAuthTokens {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
}
