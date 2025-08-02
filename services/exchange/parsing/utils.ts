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
