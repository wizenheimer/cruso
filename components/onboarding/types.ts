export interface ConnectedCalendar {
    id: string;
    email: string;
    provider: 'google';
}

export interface BufferSetting {
    id: string;
    label: string;
    value: string;
    isPrimary?: boolean;
}

export interface PersonalizationField {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    isPrimary?: boolean;
}

export interface TimeSlot {
    id: string;
    startTime: string;
    endTime: string;
}

export interface DaySchedule {
    enabled: boolean;
    timeSlots: TimeSlot[];
}

export interface WeeklySchedule {
    [key: string]: DaySchedule;
}
