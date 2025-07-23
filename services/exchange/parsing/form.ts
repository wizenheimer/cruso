import { cleanTextContent } from './text';
import { parseEmailAddress, parseEmailAddressList } from './email';
import { RawEmailData } from '@/types/exchange';

/**
 * Interface for form data value options
 */
interface FormDataValueOptions {
    decode?: boolean;
    defaultValue?: string;
    trim?: boolean;
    lowercase?: boolean;
    maxLength?: number;
    sanitize?: boolean;
    attributes?: Record<string, string>;
}

/**
 * Get a value from a FormData object.
 * @param formData - The FormData object to get the value from.
 * @param key - The key to get the value from.
 * @param options - The options for the value.
 * @returns The value from the FormData object.
 */
export const getValueFromFormData = (
    formData: FormData,
    key: string,
    options: FormDataValueOptions = {},
) => {
    // Set the default options
    const {
        decode = false,
        defaultValue = '',
        trim = false,
        lowercase = false,
        maxLength = -1, // -1 means no limit
        sanitize = false,
        attributes = null,
    } = options;

    // Get the value from the form data
    let value = (formData.get(key) as string) || defaultValue;

    // If the decode option is set, decode the value
    if (decode) {
        value = decodeFormValue(value);
    }

    // If the attributes option is set, add the attributes to the value to the start of the string
    if (attributes) {
        // Prefix the value with the attributes
        value = `${attributes}: ${value}`;
    }

    // If the value is a string, clean it up
    value = cleanTextContent(value, {
        trim,
        lowercase,
        maxLength,
        sanitize,
    });

    // Return the value
    return value;
};

/**
 * Parse a multipart body into a FormData object.
 * @param body - The body to parse.
 * @returns The parsed FormData object.
 */
export async function parseMultipartToFormData(body: string) {
    const formData = new FormData();

    if (!body) return formData;

    // Extract boundary from the first line
    const lines = body.split('\r\n');
    const boundary = lines[0].replace('--', '');

    // Split by boundary
    const parts = body.split(`--${boundary}`);

    for (const part of parts) {
        if (!part || part.trim() === '' || part.trim() === '--') continue;

        // Use regex to extract name and value
        const nameMatch = part.match(/Content-Disposition: form-data; name="([^"]+)"/);
        if (!nameMatch) {
            continue;
        }

        const name = nameMatch[1];

        // Find the value - it comes after the Content-Disposition line and any other headers
        const lines = part.split('\r\n');
        let value = '';
        let foundHeaders = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Skip the boundary line and Content-Disposition line
            if (line.startsWith('--') || line.startsWith('Content-Disposition:')) {
                continue;
            }

            // Skip other headers (lines with colons)
            if (line.includes(':') && !line.startsWith(' ')) {
                continue;
            }

            // If we hit an empty line, the value starts after it
            if (line === '') {
                foundHeaders = true;
                continue;
            }

            // If we've found headers and hit an empty line, start collecting value
            if (foundHeaders) {
                value = lines.slice(i).join('\r\n').trim();
                break;
            }
        }

        // If we didn't find value using the header approach, try a simpler approach
        if (!value) {
            // Remove the boundary and headers, what's left is the value
            const valueMatch = part.replace(
                /^--[^\r\n]+\r\n.*?Content-Disposition: form-data; name="[^"]+"\r\n(?:[^\r\n]*\r\n)*\r\n/s,
                '',
            );
            if (valueMatch) {
                value = valueMatch.trim();
            }
        }

        if (name && value !== undefined) {
            formData.append(name, value);
        }
    }

    return formData;
}

/**
 * Parse a URL encoded body into a FormData object.
 * @param body - The body to parse.
 * @returns The parsed FormData object.
 */
export async function parseURLEncodedToFormData(body: string) {
    const formData = new FormData();

    if (!body) return formData;

    const pairs = body.split('&');

    for (const pair of pairs) {
        if (!pair) continue;

        const [keyPart, valuePart] = pair.split('=');

        // Safely decode URI components with error handling
        let key: string;
        let value: string;

        try {
            key = keyPart ? decodeURIComponent(keyPart) : '';
        } catch (error) {
            key = keyPart || '';
        }

        try {
            value = valuePart ? decodeURIComponent(valuePart) : '';
        } catch (error) {
            value = valuePart || '';
        }

        if (key && value !== undefined) {
            formData.append(key, value);
        }
    }

    return formData;
}

/**
 * Decode a form value.
 * @param text - The text to decode.
 * @returns The decoded text.
 */
export function decodeFormValue(text: string): string {
    if (!text) return text;

    try {
        // First replace + with spaces, then decode URI components
        return decodeURIComponent(text.replace(/\+/g, ' '));
    } catch (error) {
        // If decoding fails, just replace + with spaces
        return text.replace(/\+/g, ' ');
    }
}

/**
 * Parse email data from a Mailgun webhook form data.
 * @param formData - The form data to parse.
 * @returns The parsed email data.
 */
export async function parseEmailDataFromMailgunWebhookFormData(
    formData: FormData,
): Promise<RawEmailData> {
    // Parse the threading info from email headers
    const messageID = getValueFromFormData(formData, 'Message-Id');
    if (!messageID) {
        throw new Error('Invalid message ID');
    }

    // If the previous message ID is not set, use the message ID as the previous message ID
    //   This indicates start of an exchange
    const previousMessageID = getValueFromFormData(formData, 'In-Reply-To');

    // Parse the timestamp from the email headers
    const timestampString = getValueFromFormData(formData, 'timestamp');
    // Attempt to parse the timestamp from the timestamp string
    // Mailgun sends Unix timestamps in seconds, so we need to convert to milliseconds
    let timestamp = parseInt(timestampString) * 1000;
    if (isNaN(timestamp) || timestamp === 0) {
        // If the timestamp is invalid, use the current timestamp
        timestamp = Date.now();
    }

    // Parse the sender info from email headers
    const from = getValueFromFormData(formData, 'From', {
        decode: true,
        lowercase: true,
    });
    const sender = parseEmailAddress(from);
    if (!sender || !sender.address) {
        throw new Error('Invalid sender email address');
    }

    // Try to get the subject from the form data
    const rawSubject =
        getValueFromFormData(formData, 'subject', { decode: true }) ||
        getValueFromFormData(formData, 'Subject', { decode: true });

    // Parse the recipients info from email headers - To, Cc
    const to = getValueFromFormData(formData, 'To', {
        decode: true,
        lowercase: true, // for case-insensitive comparison for parsed email addresses
    });
    const cc = getValueFromFormData(formData, 'Cc', {
        decode: true,
        lowercase: true, // for case-insensitive comparison for parsed email addresses
    });

    // Parse the recipients of the email
    const recipients = parseEmailAddressList(to);
    recipients.push(...parseEmailAddressList(cc));

    // Validate the recipients
    if (!recipients) {
        throw new Error('Invalid recipients email address list');
    }

    // Parse the body of the email
    const rawBody = getValueFromFormData(formData, 'body-plain');

    const emailData: RawEmailData = {
        // Threading Info - MessageID, PreviousMessageID
        messageId: messageID,
        previousMessageId: previousMessageID,
        // Normalize the sender email address
        sender: sender.address,
        // Normalize the recipients email addresses
        // Deduplicate the recipients list
        // Remove the sender from the recipients list
        recipients: [
            ...new Set(
                recipients
                    .map((recipient) => recipient.address)
                    .filter((recipient) => recipient !== sender.address),
            ),
        ],
        // Content Info - Subject, Body
        rawSubject: rawSubject,
        rawBody: rawBody,
        // Type of the email
        type: 'inbound',
        // Timestamp
        timestamp: new Date(timestamp),
    };

    return emailData;
}
