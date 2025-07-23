import { z } from 'zod';
import {
    SendEmailConfigSchema,
    ReplyConfigSchema,
    EmailSendParamsSchema,
    ReplyRecipientsSchema,
    ThreadContextSchema,
} from '@/schema/email';

// Inferred Types from Zod Schemas

/**
 * Configuration for sending emails.
 * Contains email service settings and authentication parameters.
 * Used for configuring email sending operations.
 * @see schema/email.ts - SendEmailConfigSchema definition
 * @see services/email/index.ts - Used in email service configuration
 */
export type SendEmailConfig = z.infer<typeof SendEmailConfigSchema>;

/**
 * Configuration for email reply operations.
 * Contains reply-specific settings and formatting options.
 * Used when setting up email reply functionality.
 * @see schema/email.ts - ReplyConfigSchema definition
 * @see services/email/index.ts - Used in reply email operations
 */
export type ReplyConfig = z.infer<typeof ReplyConfigSchema>;

/**
 * Parameters for sending emails.
 * Contains recipient, subject, content, and other email sending parameters.
 * Used as input for email sending operations.
 * @see schema/email.ts - EmailSendParamsSchema definition
 * @see services/email/index.ts - Used in sendEmail function
 * @see api/routes/email/index.ts - Used in email sending endpoints
 */
export type EmailSendParams = z.infer<typeof EmailSendParamsSchema>;

/**
 * Recipient information for email replies.
 * Contains email addresses and names for reply recipients.
 * Used when determining who should receive email replies.
 * @see schema/email.ts - ReplyRecipientsSchema definition
 * @see services/email/index.ts - Used in reply email operations
 */
export type ReplyRecipients = z.infer<typeof ReplyRecipientsSchema>;

/**
 * Context information for email threads.
 * Contains thread metadata and conversation history.
 * Used for maintaining email conversation context.
 * @see schema/email.ts - ThreadContextSchema definition
 * @see services/email/index.ts - Used in thread-based email operations
 * @see components/dashboard/InboxSection.tsx - Used in email thread display
 */
export type ThreadContext = z.infer<typeof ThreadContextSchema>;
