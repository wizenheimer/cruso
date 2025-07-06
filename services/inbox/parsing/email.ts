import * as emailAddresses from 'email-addresses';

/**
 * Parses a single email address into a name and address.
 *
 * @param email - The email address string to parse (e.g., "John Doe <john.doe@example.com>", "john.doe@example.com")
 * @returns An object with the name and address, or null if the email address is not valid
 */
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

/**
 * Parses a list of email addresses into an array of email addresses.
 *
 * @param addressListString - The string containing email addresses (e.g., "John Doe <john.doe@example.com>, Jane Smith <jane.smith@example.com>")
 * @returns An array of email addresses with the name and address. Invalid email addresses will be skipped
 */
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

/**
 * Parses a list of email addresses from a text string.
 * This function extracts email addresses from any text, not just properly formatted address lists.
 *
 * @param text - The text string to extract email addresses from (e.g., "Contact us at john.doe@example.com or jane.smith@example.com for more info")
 * @returns An array of email addresses with the name and address. Invalid email addresses will be skipped
 */
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
