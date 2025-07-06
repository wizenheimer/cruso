import { Context } from 'hono';
import { parseURLEncodedToFormData, parseMultipartToFormData } from './parse';
import {
    verifyMailgunWebhookFromFormData,
    verifyMailgunWebhookSpamThresholdFromFormData,
} from './verify';
import { businessEmailToleranceOptions } from './constants';
import { EmailData, parseEmailDataFromMailgunWebhookFormData } from './content';

// parseInboundWebhookWithoutAttachments is a function that parses an inbound email webhook without attachments.
export async function parseInboundWebhookWithoutAttachments(body: string): Promise<EmailData> {
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
export async function parseInboundWebhookWithAttachments(body: string): Promise<EmailData> {
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
