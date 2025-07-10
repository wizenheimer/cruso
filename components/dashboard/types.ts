export interface CalendarAccount {
    id: string;
    email: string;
    provider: string;
    isPrimary: boolean;
    calendars: {
        name: string;
        enabled: boolean;
    }[];
}

export interface EmailAccount {
    id: string;
    email: string;
    provider: string;
    isPrimary: boolean;
}

export interface Preferences {
    id: number;
    userId: string;
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
