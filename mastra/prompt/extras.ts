// mastra/commons/prompt.ts
import { DateTime } from 'luxon';

/**
 * Get the timestamp prompt
 * @param timestamp - The timestamp
 * @param timezone - The timezone
 * @returns The timestamp prompt
 */
export const getTimestampPrompt = (timestamp: number, timezone: string) => {
    let date: DateTime;

    try {
        // Try to create DateTime with the specified timezone
        date = DateTime.fromMillis(timestamp).setZone(timezone);

        // Check if the date is valid (this will catch invalid timezone issues too)
        if (!date.isValid) {
            throw new Error('Invalid timezone or date');
        }
    } catch (error) {
        console.warn(`Failed to use timezone "${timezone}", falling back to UTC:`, error);
        // Fallback to UTC if timezone is invalid
        date = DateTime.fromMillis(timestamp).setZone('UTC');
    }

    const formattedDate = date.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ');

    return `# Current Time and Timezone\n
    The USER'S CURRENT TIME is ${formattedDate} and THE USER'S CURRENT TIMEZONE is ${timezone}. This timestamp is the sole reference for determining all scheduling times. Anchor to this exact date value for the duration of this exchange. No exceptions. Every event, timeslot, deadline, or conflict must be evaluated and resolved with this EXACT timestamp (${formattedDate}) in mind. Always make sure to use the correct date and resolve conflicts based on this date.`;
};

/**
 * Get the host prompt
 * @param host - The host
 * @returns The host prompt
 */
export const getHostPrompt = (host: string) => {
    return `# Host\n
    The host is ${host}.`;
};

/**
 * Get the attendees prompt
 * @param attendees - The attendees
 * @returns The attendees prompt
 */
export const getAttendeesPrompt = (attendees: string[]) => {
    return `# Attendees\n
    The attendees are ${attendees.join(', ')}.`;
};

/**
 * Get the preference prompt
 * @param preference - The preference
 * @returns The preference prompt
 */
export const getPreferencePrompt = (preference: string) => {
    return `# Executive's Preferences\n
    ${preference.trim()}`;
};
