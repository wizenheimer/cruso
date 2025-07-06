import { decodeFormValue } from '@/services/inbox/parsing/form';

/**
 * Clean up the plain text content of an email.
 * @param content - The content to clean up.
 * @param options - The options for the cleaning.
 * @returns The cleaned up content.
 */
export function cleanTextContent(
    content: string,
    options: {
        maxLength?: number; // The maximum length of the content
        trim?: boolean; // Whether to trim the content
        lowercase?: boolean; // Whether to convert the content to lowercase
        sanitize?: boolean; // Whether to sanitize the content
        decode?: boolean; // Whether to decode the content
    } = {},
) {
    // Set the default options
    const {
        maxLength = 1000,
        trim = false,
        lowercase = false,
        sanitize = false,
        decode = false,
    } = options;

    // If the trim option is set, trim the value
    if (trim) {
        content = content.trim();
    }

    // If the lowercase option is set, convert the value to lowercase
    if (lowercase) {
        content = content.toLowerCase();
    }

    // Sanitize the content
    if (sanitize) {
        content = sanitizeContent(content);
    }

    // Decode the content
    if (decode) {
        content = decodeFormValue(content);
    }

    // If the maxLength option is set, truncate the value
    if (maxLength > 0) {
        content = content.slice(0, maxLength);
    }

    return content;
}

/**
 * Sanitize the content of an email.
 * @param content - The content to sanitize.
 * @returns The sanitized content.
 */
export function sanitizeContent(content: string): string {
    if (!content) return '';

    return (
        content
            // Remove \r\n and \r, replace with spaces
            .replace(/\r\n/g, ' ')
            .replace(/\r/g, ' ')
            // Replace \n with spaces
            .replace(/\n/g, ' ')
            // Replace multiple spaces with single space
            .replace(/\s+/g, ' ')
            // Trim leading/trailing whitespace
            .trim()
    );
}

/**
 * Generate a prefix for the body of an email.
 * @description This function is used to generate a prefix for the body of an email.
 * @param sender - The sender of the email.
 * @param timestamp - The timestamp of the email.
 * @returns The prefix for the subject of the email.
 */
export function generatePrefixForBody(
    sender: { name: string; address: string },
    timestamp: Date,
): string {
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(timestamp);

    return `${sender.name} <${sender.address}> wrote on ${formattedDate}:`.toLowerCase().trim();
}
