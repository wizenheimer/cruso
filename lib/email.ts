import disallowlist from '@/data/email.domain.json';

// Create a Map for O(1) lookup performance
const disallowMap = new Map<string, boolean>();
disallowlist.forEach((item) => disallowMap.set(item, true));

// Check if the email is in the disallowlist
// Returns true if the email is in the disallowlist
// Returns false if the email is not in the disallowlist
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
    return disallowMap.has(domain);
};
