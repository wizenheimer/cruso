// EmailData is a type that represents the data of an email.
export type RawEmailData = {
    messageId: string; // MessageID of the email
    previousMessageId: string | null; // MessageID of the previous email - null if the email is the first in the exchange
    sender: string; // Email address of the sender
    recipients: string[]; // Email addresses of the recipients - includes CC and BCC
    rawSubject: string; // Subject of the email
    rawBody: string; // Body of the email
    timestamp: Date; // Timestamp of the email
    type: 'inbound' | 'outbound'; // Type of the email - inbound or outbound
};

export type EmailData = Omit<
    RawEmailData & {
        id: string; // UUID for the email
        parentId: string; // UUID for the parent email
        subject: string; // Subject of the email - sanitized
        body: string; // Body of the email - sanitized
    },
    'rawSubject' | 'rawBody'
>;
