import disallowlist from '@/data/email.domain.json';
import disallowAddressList from '@/data/shared.address.json';

// Create a Map for O(1) lookup performance
const disallowDomainMap = new Map<string, boolean>();
disallowlist.forEach((item) => disallowDomainMap.set(item, true));

const disallowAddressMap = new Map<string, boolean>();
disallowAddressList.forEach((item) => disallowAddressMap.set(item, true));

/**
 * Check if the email is in the disallowlist
 * @param email - The email to check
 * @returns true if the email is in the disallowlist, false otherwise
 */
export const isDisallowedDomain = (email: string) => {
    // Handle edge cases
    if (!email || typeof email !== 'string') {
        return true; // Invalid email format
    }

    // Parse domain from email
    const atIndex = email.indexOf('@');
    if (atIndex === -1 || atIndex === email.length - 1) {
        // No @ symbol or @ is at the end - invalid email format
        return true; // Invalid email format
    }

    const domain = email.substring(atIndex + 1).toLowerCase();

    // Check if the domain is in the disallowlist using Map
    return disallowDomainMap.has(domain);
};

/**
 * Check if the email is in the disallowlist
 * @param email - The email to check
 * @returns true if the email is in the disallowlist, false otherwise
 */
export const isDisallowedAddress = (email: string) => {
    // Handle edge cases
    if (!email || typeof email !== 'string') {
        return true; // Invalid email format
    }

    // Parse address from email
    const atIndex = email.indexOf('@');
    if (atIndex === -1 || atIndex === email.length - 1) {
        return true; // Invalid email format
    }

    const address = email.substring(0, atIndex);

    // Check if the address is in the disallowlist
    return disallowAddressMap.has(address);
};
