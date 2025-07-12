/**
 * Default preference values
 */
export const PREFERENCES_DEFAULTS = {
    // Time settings
    TIMEZONE: 'America/New_York' as string,
    MIN_NOTICE_MINUTES: 120, // 2 hours
    MAX_DAYS_AHEAD: 60,
    DEFAULT_MEETING_DURATION_MINUTES: 30,

    // Buffer settings
    VIRTUAL_BUFFER_MINUTES: 0,
    IN_PERSON_BUFFER_MINUTES: 15,
    BACK_TO_BACK_BUFFER_MINUTES: 0,
    FLIGHT_BUFFER_MINUTES: 0,

    // Text content
    DOCUMENT: '' as string,
    DISPLAY_NAME: '' as string,
    NICKNAME: '' as string,
    SIGNATURE: '' as string,
} as const;
