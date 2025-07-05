// mailgunWebhookSigningKey is the signing key for the Mailgun webhook.
export const mailgunWebhookSigningKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;

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

export const subjectMaxLength = 100;
export const bodyMaxLength = 1000;
