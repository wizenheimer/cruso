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
    message: string;
}
