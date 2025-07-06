import { v4 as uuidv4 } from 'uuid';
import { getValueFromFormData } from './utils';
import { parseEmailAddressList, parseEmailAddress } from './parse';
import { bodyMaxLength, subjectMaxLength } from './constants';

// EmailData is a type that represents the data of an email.
export type EmailData = {
    id: string; // UUID for the email
    parentId: string; // UUID for the parent email
    messageId: string; // MessageID of the email
    previousMessageId: string | null; // MessageID of the previous email - null if the email is the first in the exchange
    sender: string; // Email address of the sender
    recipients: string[]; // Email addresses of the recipients - includes CC and BCC
    subject: string; // Subject of the email
    body: string; // Body of the email
    timestamp: Date; // Timestamp of the email
    type: 'inbound' | 'outbound'; // Type of the email - inbound or outbound
};

// generateEmailPrefix is a function that generates a prefix for an email.
export function generateEmailPrefix(
    sender: { name: string; address: string },
    timestamp: Date,
): string {
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(timestamp);

    return `${sender.name} <${sender.address}> wrote on ${formattedDate}:`.toLowerCase().trim();
}

// parseEmailDataFromMailgunWebhookFormData is a function that parses email data from a Mailgun webhook form data.
export async function parseEmailDataFromMailgunWebhookFormData(
    formData: FormData,
): Promise<EmailData> {
    // Parse the threading info from email headers
    const messageID = getValueFromFormData(formData, 'Message-Id');
    if (!messageID) {
        throw new Error('Invalid message ID');
    }

    // If the previous message ID is not set, use the message ID as the previous message ID
    //   This indicates start of an exchange
    const previousMessageID = getValueFromFormData(formData, 'In-Reply-To');

    // Parse the timestamp from the email headers
    const timestampString = getValueFromFormData(formData, 'timestamp');
    // Attempt to parse the timestamp from the timestamp string
    // Mailgun sends Unix timestamps in seconds, so we need to convert to milliseconds
    let timestamp = parseInt(timestampString) * 1000;
    if (isNaN(timestamp) || timestamp === 0) {
        // If the timestamp is invalid, use the current timestamp
        timestamp = Date.now();
    }

    // Parse the sender info from email headers
    const from = getValueFromFormData(formData, 'From', {
        decode: true,
        lowercase: true,
    });
    const sender = parseEmailAddress(from);
    if (!sender || !sender.address) {
        throw new Error('Invalid sender email address');
    }

    // Try to get the subject from the form data
    const subject =
        getValueFromFormData(formData, 'subject', {
            decode: true,
            trim: true,
            lowercase: true, // for case-insensitive comparison for parsed email addresses
            maxLength: subjectMaxLength,
        }) ||
        getValueFromFormData(formData, 'Subject', {
            decode: true,
            trim: true,
            lowercase: true, // for case-insensitive comparison for parsed email addresses
            maxLength: subjectMaxLength,
        });

    // Parse the recipients info from email headers - To, Cc
    const to = getValueFromFormData(formData, 'To', {
        decode: true,
        lowercase: true, // for case-insensitive comparison for parsed email addresses
    });
    const cc = getValueFromFormData(formData, 'Cc', {
        decode: true,
        lowercase: true, // for case-insensitive comparison for parsed email addresses
    });

    // Parse the recipients of the email
    const recipients = parseEmailAddressList(to);
    recipients.push(...parseEmailAddressList(cc));

    // Validate the recipients
    if (!recipients) {
        throw new Error('Invalid recipients email address list');
    }

    // Create the email attributes
    const emailAttributes = generateEmailPrefix(sender, new Date(timestamp));

    // Parse the body of the email
    const body = getValueFromFormData(formData, 'body-plain', {
        decode: true,
        trim: true,
        lowercase: true, // for case-insensitive comparison for parsed email addresses
        maxLength: bodyMaxLength,
        sanitize: true,
        attributes: emailAttributes,
    });

    const emailData: EmailData = {
        // Exchange Info - ID, ParentID
        id: uuidv4(),
        parentId: uuidv4(),
        // Threading Info - MessageID, PreviousMessageID
        messageId: messageID,
        previousMessageId: previousMessageID,
        // Normalize the sender email address
        sender: sender.address,
        // Normalize the recipients email addresses
        // Deduplicate the recipients list
        // Remove the sender from the recipients list
        recipients: [
            ...new Set(
                recipients
                    .map((recipient) => recipient.address)
                    .filter((recipient) => recipient !== sender.address),
            ),
        ],
        // Content Info - Subject, Body
        subject: subject,
        body: body,
        // Type of the email
        type: 'inbound',
        // Timestamp
        timestamp: new Date(timestamp),
    };

    return emailData;
}
