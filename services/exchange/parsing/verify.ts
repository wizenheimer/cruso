import { getValueFromFormData } from './form';

/**
 * The signing key for the Mailgun webhook verification.
 * @type {string | undefined}
 */
export const mailgunWebhookSigningKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;

/**
 * Interface for Mailgun webhook signature payload
 */
interface MailgunWebhookSignature {
    token: string;
    signature: string;
    timestamp: string;
}

/**
 * Interface for Mailgun webhook JSON payload
 */
interface MailgunWebhookPayload {
    signature?: MailgunWebhookSignature;
}

/**
 * Verifies the signature of a webhook using HMAC-SHA256.
 *
 * @param {string} webhookSignature - The signature to verify
 * @param {string} webhookTimestamp - The timestamp of the webhook
 * @param {string} webhookToken - The token from the webhook
 * @returns {Promise<boolean>} True if the signature is valid, false otherwise
 */
export async function verifyWebhook(
    webhookSignature: string,
    webhookTimestamp: string,
    webhookToken: string,
): Promise<boolean> {
    if (!mailgunWebhookSigningKey || !webhookSignature || !webhookTimestamp || !webhookToken) {
        return false;
    }

    const timestamp = parseInt(webhookTimestamp);

    const message = `${timestamp}${webhookToken}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(mailgunWebhookSigningKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );

    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return expectedSignature === webhookSignature;
}

/**
 * Verifies the signature of a Mailgun webhook from a FormData object.
 *
 * @param {FormData} formData - The FormData object containing webhook data
 * @returns {Promise<boolean>} True if the signature is valid, false otherwise
 */
export async function verifyMailgunWebhookFromFormData(formData: FormData): Promise<boolean> {
    const webhookToken = getValueFromFormData(formData, 'token');
    const webhookSignature = getValueFromFormData(formData, 'signature');
    const webhookTimestampString = getValueFromFormData(formData, 'timestamp');

    return verifyWebhook(webhookSignature, webhookTimestampString, webhookToken);
}

/**
 * Verifies the signature of a Mailgun JSON webhook payload.
 *
 * @param {MailgunWebhookPayload} payload - The JSON payload containing webhook data
 * @returns {Promise<boolean>} True if the signature is valid, false otherwise
 */
export async function verifyMailgunWebhookFromJSONPayload(
    payload: MailgunWebhookPayload,
): Promise<boolean> {
    const signature = payload?.signature;
    if (!signature) {
        return false;
    }

    const webhookToken = signature.token;
    const webhookSignature = signature.signature;
    const webhookTimestampString = signature.timestamp;

    return verifyWebhook(webhookSignature, webhookTimestampString, webhookToken);
}

/**
 * Verifies the spam tolerance of a Mailgun webhook from a FormData object.
 * Checks various spam-related headers like X-Mailgun-Sscore, X-Mailgun-Sflag,
 * X-Mailgun-Dkim-Check-Result, X-Mailgun-Spf, X-Mailgun-Spam-Points, X-Mailgun-Spam-Rules.
 *
 * @param {FormData} formData - The FormData object containing webhook data
 * @param {Object} options - Configuration options for spam filtering
 * @param {number} [options.maxSpamScore=0.5] - Maximum allowed spam score (0.5 is default)
 * @param {number} [options.maxIndividualSpamPoint=5.0] - Maximum allowed individual spam point (5.0 is default)
 * @param {boolean} [options.requireDkim=true] - Whether DKIM verification is required
 * @param {boolean} [options.requireSpf=true] - Whether SPF verification is required
 * @param {boolean} [options.allowHighRiskRules=true] - Whether to allow high-risk spam rules
 * @returns {Promise<boolean>} True if the webhook is considered spam, false otherwise
 */
export async function verifyMailgunWebhookSpamThresholdFromFormData(
    formData: FormData,
    options: {
        maxSpamScore?: number;
        maxIndividualSpamPoint?: number;
        requireDkim?: boolean;
        requireSpf?: boolean;
        allowHighRiskRules?: boolean;
    } = {},
): Promise<boolean> {
    const {
        maxSpamScore = 0.5, // 0.5 is the default spam score
        maxIndividualSpamPoint = 5.0, // 5.0 is the default individual spam point
        requireDkim = true, // true is the default
        requireSpf = true, // true is the default
        allowHighRiskRules = true, // true is the default
    } = options;

    // Get spam-related fields from the form data
    const spamScore = getValueFromFormData(formData, 'X-Mailgun-Sscore');
    const spamFlag = getValueFromFormData(formData, 'X-Mailgun-Sflag');
    const dkimResult = getValueFromFormData(formData, 'X-Mailgun-Dkim-Check-Result');
    const spfResult = getValueFromFormData(formData, 'X-Mailgun-Spf');
    const spamPoints = getValueFromFormData(formData, 'X-Mailgun-Spam-Points');
    const spamRules = getValueFromFormData(formData, 'X-Mailgun-Spam-Rules');

    // Check if spam flag is set to "Yes"
    if (spamFlag.trim().toLowerCase().includes('yes')) {
        return true;
    }

    // Check spam score against configurable threshold
    const score = parseFloat(spamScore);
    if (isNaN(score) || score >= maxSpamScore) {
        return true;
    }

    // Check DKIM verification if required
    if (requireDkim && !dkimResult.trim().toLowerCase().includes('pass')) {
        return true;
    }

    // Check SPF verification if required
    if (requireSpf && spfResult.trim().toLowerCase() !== 'pass') {
        return true;
    }

    // Check for high-risk spam rules if not allowed
    if (!allowHighRiskRules && spamRules) {
        const highRiskRules = [
            'URIBL_DBL_BLOCKED_OPENDNS', // Often false positives
            'RCVD_IN_VALIDITY_SAFE_BLOCKED', // Agressive reputation block
            'RCVD_IN_VALIDITY_RPBL_BLOCKED',
            'URIBL_ZEN_BLOCKED_OPENDNS',
        ];

        const rules = spamRules.split(',');
        for (const rule of highRiskRules) {
            if (rules.includes(rule)) {
                return true;
            }
        }
    }

    // Check spam points for any extremely high individual scores
    if (spamPoints) {
        const points = spamPoints.split(',').map((p) => parseFloat(p.trim()));
        for (const point of points) {
            if (!isNaN(point) && point > maxIndividualSpamPoint) {
                return true;
            }
        }
    }

    return false; // If non of the above filters are triggered, the webhook is not spam
}
