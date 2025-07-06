import {
    verifyMailgunWebhookFromFormData,
    verifyMailgunWebhookSpamThresholdFromFormData,
} from '@/services/inbox/parsing/verify';
import { RawEmailData } from '@/services/inbox/types';
import {
    parseURLEncodedToFormData,
    parseMultipartToFormData,
    parseEmailDataFromMailgunWebhookFormData,
} from '@/services/inbox/parsing/form';

// businessEmailToleranceOptions is a function that sets the tolerance for business emails.
// e.g. - work domains, etc.
export const businessEmailToleranceOptions = {
    maxSpamScore: 2, // 2 - higher tolerance for business emails
    maxIndividualSpamPoint: 5.0, // 5.0 is the default individual spam point
    requireDkim: false, // true is the default - forwarding emails might have misconfigured DKIM
    requireSpf: false, // true is the default - higher tolerance for business emails
    allowHighRiskRules: true, // true is the default - results in false positives
};

// personalEmailToleranceOptions is a function that sets the tolerance for personal emails.
// e.g. - @gmail.com, @yahoo.com, @hotmail.com, @outlook.com, etc.
export const personalEmailToleranceOptions = {
    maxSpamScore: 0.5, // 0.5 - lower tolerance for personal emails
    maxIndividualSpamPoint: 5.0, // 5.0 is the default individual spam point
    requireDkim: true, // true is the default - lower tolerance for personal emails
    requireSpf: true, // true is the default - lower tolerance for personal emails
    allowHighRiskRules: true, // true is the default - results in false positives
};

// subjectMaxLength is the maximum length of the subject of an email.
// e.g. - 100 characters
export const subjectMaxLength = 100;

// bodyMaxLength is the maximum length of the body of an email.
// e.g. - 1000 characters
export const bodyMaxLength = 1000;

// parseInboundWebhookWithoutAttachments is a function that parses an inbound email webhook without attachments.
export async function parseInboundWebhookWithoutAttachments(body: string): Promise<RawEmailData> {
    console.log('parsing inbound webhook without attachments');
    const formData = await parseURLEncodedToFormData(body); // Payload is application/x-www-form-urlencoded

    const isSignatureValid = await verifyMailgunWebhookFromFormData(formData);

    if (!isSignatureValid) {
        throw new Error('Invalid webhook signature');
    }

    const isSpam = await verifyMailgunWebhookSpamThresholdFromFormData(
        formData,
        businessEmailToleranceOptions,
    );

    if (isSpam) {
        throw new Error('webhook flagged as spam');
    }

    const emailData = await parseEmailDataFromMailgunWebhookFormData(formData);

    console.log('emailData', emailData);

    console.log('processed inbound webhook without attachments');

    return emailData;
}

// parseInboundWebhookWithAttachments is a function that parses an inbound email webhook with attachments.
export async function parseInboundWebhookWithAttachments(body: string): Promise<RawEmailData> {
    console.log('parsing inbound webhook with attachments');
    // Create a new request with the body to parse as multipart
    const formData = await parseMultipartToFormData(body); // Payload is multipart/form-data

    const isSignatureValid = await verifyMailgunWebhookFromFormData(formData);

    if (!isSignatureValid) {
        throw new Error('Invalid webhook signature');
    }

    const isSpam = await verifyMailgunWebhookSpamThresholdFromFormData(
        formData,
        businessEmailToleranceOptions,
    );

    if (isSpam) {
        throw new Error('webhook flagged as spam');
    }

    const emailData = await parseEmailDataFromMailgunWebhookFormData(formData);

    console.log('emailData', emailData);

    console.log('processed inbound webhook with attachments');

    return emailData;
}
