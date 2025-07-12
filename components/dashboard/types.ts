export interface CalendarAccount {
    id: string;
    email: string;
    provider: string;
    isPrimary: boolean;
    calendars: {
        id: string;
        name: string;
        enabled: boolean;
    }[];
}

export interface EmailAccount {
    id: number;
    email: string;
    provider: string;
    isPrimary: boolean;
}

export interface Preferences {
    id: number;
    userId: string;
    primaryUserEmailId?: number | null;
    primaryAccountId?: string | null;
    document: string;
    displayName?: string;
    nickname?: string;
    signature?: string;
    timezone?: string;
    minNoticeMinutes: number;
    maxDaysAhead: number;
    defaultMeetingDurationMinutes: number;
    virtualBufferMinutes: number;
    inPersonBufferMinutes: number;
    backToBackBufferMinutes: number;
    flightBufferMinutes: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface PreferencesWithPrimaries {
    preferences: Preferences;
    primaryUserEmail: {
        id: number;
        email: string;
        isPrimary: boolean;
    } | null;
    primaryAccount: {
        id: string;
        accountId: string;
        googleEmail: string;
        calendarName: string | null;
        isPrimary: boolean;
    } | null;
}

export interface PrimaryEmailOption {
    id: number;
    email: string;
    isPrimary: boolean;
}

export interface PrimaryAccountOption {
    id: string;
    accountId: string;
    googleEmail: string;
    calendarName: string | null;
    isPrimary: boolean;
}

export interface PrimaryOptions {
    emails: PrimaryEmailOption[];
    accounts: PrimaryAccountOption[];
}
