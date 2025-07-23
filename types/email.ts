import { EmailData } from '@/types/exchange';

// Email Configuration Types
export interface SendEmailConfig {
    recipients: string[];
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
    replyTo?: EmailData; // If replying to an email
    newThread?: boolean; // Force new thread (default: true if no replyTo)
}

// Reply Configuration Types
export interface ReplyConfig {
    type: 'sender-only' | 'all-including-sender' | 'all-excluding-sender' | 'all-with-cc-to-sender';
    body: string;
    subject?: string;
}

// Email Send Parameters Types
export interface EmailSendParams {
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    body: string;
    exchangeId: string;
    previousMessageId: string | null;
}

// Reply Recipients Types
export interface ReplyRecipients {
    to: string[];
    cc: string[];
}

// Thread Context Types
export interface ThreadContext {
    exchangeId: string;
    previousMessageId: string | null;
}
