/**
 * Default preference values
 */
export const PREFERENCES_DEFAULTS = {
    // Time settings
    TIMEZONE: 'America/New_York' as string,
    MIN_NOTICE_MINUTES: 30, // 30 minutes
    MAX_DAYS_AHEAD: 180, // 6 months
    DEFAULT_MEETING_DURATION_MINUTES: 25, // 25 minutes

    // Buffer settings
    VIRTUAL_BUFFER_MINUTES: 15,
    IN_PERSON_BUFFER_MINUTES: 25,
    BACK_TO_BACK_BUFFER_MINUTES: 25,
    FLIGHT_BUFFER_MINUTES: 30,

    // Text content
    DOCUMENT: '' as string,
    DISPLAY_NAME: 'User' as string,
    NICKNAME: 'User' as string,
    SIGNATURE: "User's AI Assistant" as string,
} as const;
