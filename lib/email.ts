import disallowlist from '@/data/email.domain.json';
import disallowAddressList from '@/data/shared.address.json';
import * as emailAddresses from 'email-addresses';

// Create a Map for O(1) lookup performance
const disallowDomainMap = new Map<string, boolean>();
disallowlist.forEach((item) => disallowDomainMap.set(item, true));

const disallowAddressMap = new Map<string, boolean>();
disallowAddressList.forEach((item) => disallowAddressMap.set(item, true));

/**
 * Check if the email domain or address is in the disallowlist
 * @param email - The email to check
 * @returns Object with domain and address validation results
 */
export const checkDisallowedEmail = (email: string) => {
    // Handle edge cases
    if (!email || typeof email !== 'string') {
        return true;
    }

    // Parse email using email-addresses package
    const parsed = emailAddresses.parseOneAddress(email);
    if (!parsed || parsed.type !== 'mailbox') {
        return true;
    }

    const domain = parsed.domain?.toLowerCase();
    const address = parsed.local;

    return !domain || disallowDomainMap.has(domain) || !address || disallowAddressMap.has(address);
};
