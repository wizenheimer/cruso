import {
    verifyMailgunWebhookFromFormData,
    verifyMailgunWebhookSpamThresholdFromFormData,
} from '@/services/exchange/parsing/verify';
import { EmailData, RawEmailData } from '@/types/exchange';
import {
    parseURLEncodedToFormData,
    parseMultipartToFormData,
    parseEmailDataFromMailgunWebhookFormData,
} from '@/services/exchange/parsing/form';

/**
 * Tolerance options for business emails with higher tolerance settings.
 * Used for work domains and business-related email addresses.
 *
 * @property {number} maxSpamScore - Maximum spam score threshold (2 - higher tolerance for business emails)
 * @property {number} maxIndividualSpamPoint - Maximum individual spam point threshold (5.0 is the default)
 * @property {boolean} requireDkim - Whether DKIM verification is required (false - forwarding emails might have misconfigured DKIM)
 * @property {boolean} requireSpf - Whether SPF verification is required (false - higher tolerance for business emails)
 * @property {boolean} allowHighRiskRules - Whether to allow high-risk rules (true - results in false positives)
 */
export const businessEmailToleranceOptions = {
    maxSpamScore: 2, // 2 - higher tolerance for business emails
    maxIndividualSpamPoint: 5.0, // 5.0 is the default individual spam point
    requireDkim: false, // true is the default - forwarding emails might have misconfigured DKIM
    requireSpf: false, // true is the default - higher tolerance for business emails
    allowHighRiskRules: true, // true is the default - results in false positives
};

/**
 * Tolerance options for personal emails with stricter settings.
 * Used for personal email domains like @gmail.com, @yahoo.com, @hotmail.com, @outlook.com, etc.
 *
 * @property {number} maxSpamScore - Maximum spam score threshold (0.5 - lower tolerance for personal emails)
 * @property {number} maxIndividualSpamPoint - Maximum individual spam point threshold (5.0 is the default)
 * @property {boolean} requireDkim - Whether DKIM verification is required (true - lower tolerance for personal emails)
 * @property {boolean} requireSpf - Whether SPF verification is required (true - lower tolerance for personal emails)
 * @property {boolean} allowHighRiskRules - Whether to allow high-risk rules (true - results in false positives)
 */
export const personalEmailToleranceOptions = {
    maxSpamScore: 0.5, // 0.5 - lower tolerance for personal emails
    maxIndividualSpamPoint: 5.0, // 5.0 is the default individual spam point
    requireDkim: true, // true is the default - lower tolerance for personal emails
    requireSpf: true, // true is the default - lower tolerance for personal emails
    allowHighRiskRules: true, // true is the default - results in false positives
};

/**
 * Maximum length allowed for email subject lines.
 *
 * @type {number}
 * @example 100 characters
 */
export const subjectMaxLength = 100;

/**
 * Maximum length allowed for email body content.
 *
 * @type {number}
 * @example 1000 characters
 */
export const bodyMaxLength = 1000;

/**
 * Parses an inbound email webhook without attachments.
 *
 * @param {string} body - The raw webhook body payload (application/x-www-form-urlencoded format)
 * @returns {Promise<RawEmailData>} Parsed email data object
 * @throws {Error} When webhook signature is invalid
 * @throws {Error} When webhook is flagged as spam
 *
 * @example
 * ```typescript
 * const emailData = await parseInboundWebhookWithoutAttachments(webhookBody);
 * ```
 */
export async function parseInboundWebhookWithoutAttachments(body: string): Promise<RawEmailData> {
    console.log('parsing inbound webhook without attachments');
    const formData = await parseURLEncodedToFormData(body); // Payload is application/x-www-form-urlencoded

    const isSignatureValid = await verifyMailgunWebhookFromFormData(formData);

    if (!isSignatureValid) {
        throw new Error('Invalid webhook signature');
    }

    const emailData = await parseEmailDataFromMailgunWebhookFormData(formData);

    console.log('emailData parsed successfully');

    return emailData;
}

/**
 * Parses an inbound email webhook with attachments.
 *
 * @param {string} body - The raw webhook body payload (multipart/form-data format)
 * @returns {Promise<RawEmailData>} Parsed email data object including attachments
 * @throws {Error} When webhook signature is invalid
 * @throws {Error} When webhook is flagged as spam
 *
 * @example
 * ```typescript
 * const emailData = await parseInboundWebhookWithAttachments(webhookBody);
 * ```
 */
export async function parseInboundWebhookWithAttachments(body: string): Promise<RawEmailData> {
    console.log('parsing inbound webhook with attachments');
    // Create a new request with the body to parse as multipart
    const formData = await parseMultipartToFormData(body); // Payload is multipart/form-data

    const isSignatureValid = await verifyMailgunWebhookFromFormData(formData);

    if (!isSignatureValid) {
        throw new Error('Invalid webhook signature');
    }

    // Deprecated - we are not using spam threshold anymore
    // const isSpam = await verifyMailgunWebhookSpamThresholdFromFormData(
    //     formData,
    //     businessEmailToleranceOptions,
    // );

    const emailData = await parseEmailDataFromMailgunWebhookFormData(formData);

    console.log('processed emailData successfully');

    return emailData;
}
