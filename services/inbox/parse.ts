import * as emailAddresses from 'email-addresses';

// parseMultipartToFormData is a function that parses a multipart body into a FormData object.
// i.e. - multipart/form-data
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

// parseURLEncodedToFormData is a function that parses a URL encoded body into a FormData object.
// i.e. - application/x-www-form-urlencoded
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

// cleanTextContent is a function that cleans up the plain text content of an email.
export function cleanTextContent(
    content: string,
    options: {
        maxLength?: number; // The maximum length of the content
        trim?: boolean; // Whether to trim the content
        lowercase?: boolean; // Whether to convert the content to lowercase
        sanitize?: boolean; // Whether to sanitize the content
    } = {},
) {
    // Set the default options
    const { maxLength = 1000, trim = false, lowercase = false, sanitize = false } = options;

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

    // If the maxLength option is set, truncate the value
    if (maxLength > 0) {
        content = content.slice(0, maxLength);
    }

    return content;
}

/**
 * Sanitizes content by removing \r\n and \r, replacing with spaces, and replacing multiple spaces with single space.
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

// decodeFormValue is a function that decodes a form value.
// i.e. - "John+Doe+%40example.com" -> "John Doe @example.com"
// Returns the decoded text.
// If the text is not valid, it will be returned as is.
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

// parseEmailAddress is a function that parses a single email address into a name and address.
// i.e. - "John Doe <john.doe@example.com>", "john.doe@example.com", etc.
// Returns an object with the name and address.
// If the email address is not valid, it will be null.
export function parseEmailAddress(email: string): { name: string; address: string } | null {
    if (!email) return null;

    const parsed = emailAddresses.parseOneAddress(email);

    if (!parsed) return null;

    // parseOneAddress should only return mailbox type, but let's be safe
    if ('address' in parsed) {
        return {
            name: parsed.name || '',
            address: parsed.address,
        };
    }

    return null;
}

// parseEmailAddressList is a function that parses a list of email addresses into an array of email addresses.
// i.e. - "John Doe <john.doe@example.com>, Jane Smith <jane.smith@example.com>"
// Returns an array of email addresses with the name and address.
// If the email address is not valid, it will be skipped.
export function parseEmailAddressList(
    addressListString: string,
): { name: string; address: string }[] {
    if (!addressListString) return [];

    const parsed = emailAddresses.parseAddressList(addressListString);

    if (!parsed) return [];

    const result: { name: string; address: string }[] = [];

    for (const addr of parsed) {
        if (addr.type === 'group') {
            // Handle group addresses: "Group Name: addr1@example.com, addr2@example.com;"
            for (const groupAddr of addr.addresses) {
                if ('address' in groupAddr) {
                    result.push({
                        name: groupAddr.name || '',
                        address: groupAddr.address,
                    });
                }
            }
        } else if ('address' in addr) {
            // Handle regular mailbox addresses
            result.push({
                name: addr.name || '',
                address: addr.address,
            });
        }
    }

    return result;
}

// parseEmailAddressesFromText is a function that parses a list of email addresses from a text string.
// This function extracts email addresses from any text, not just properly formatted address lists.
// i.e. - "Contact us at john.doe@example.com or jane.smith@example.com for more info"
// Returns an array of email addresses with the name and address.
// If the email address is not valid, it will be skipped.
export function parseEmailAddressesFromText(text: string): { name: string; address: string }[] {
    if (!text) return [];

    // Use a more comprehensive regex to find email addresses in text
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailPattern);

    if (!matches) return [];

    // Filter out invalid emails using the email-addresses library
    return matches
        .map((email) => parseEmailAddress(email))
        .filter((addr): addr is { name: string; address: string } => addr !== null);
}
