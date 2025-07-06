import { Context } from 'hono';
import {
    parseInboundWebhookWithAttachments,
    parseInboundWebhookWithoutAttachments,
} from './inbound';
import { EmailData } from './content';
import { db } from '@/db';
import { inboxData } from '@/db/schema/inbox';
import { and, asc, count, desc, eq, or, sql } from 'drizzle-orm';
import { CreateInboxData, InboxFilters } from '@/types/api/inbox';

// InboxService class for handling the inbox
export class InboxService {
    private static instance: InboxService | null = null;
    private db: typeof db;

    private constructor() {
        this.db = db;
    }

    public static getInstance(): InboxService {
        if (!InboxService.instance) {
            InboxService.instance = new InboxService();
        }
        return InboxService.instance;
    }

    // parseEmail parses the inbound webhook and returns the parsed data
    // It supports multipart data.
    async parseEmail(c: Context): Promise<EmailData> {
        const contentType = c.req.header('content-type') || '';

        // Check if it's actually multipart data even if content-type doesn't say so
        const body = await c.req.text();
        const isMultipart =
            body.startsWith('--') && body.includes('Content-Disposition: form-data');

        let emailData: EmailData;
        if (contentType.includes('multipart/form-data') || isMultipart) {
            // Inbound email webhook with attachments (or multipart data)
            emailData = await parseInboundWebhookWithAttachments(body);
        } else if (contentType.includes('application/json')) {
            // Outbound email webhook
            throw new Error('outbound webhook not supported');
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            // Inbound email webhook without attachments
            emailData = await parseInboundWebhookWithoutAttachments(body);
        } else {
            throw new Error('Unsupported content type');
        }

        const previousMessageID = emailData.previousMessageId;
        if (!previousMessageID) {
            return emailData;
        }

        // Check if the previous message exists
        const previousMessage = await this.getByMessageId(previousMessageID);
        if (!previousMessage) {
            return emailData;
        }

        // If the previous message exists, we need to update the email data
        emailData.parentId = previousMessage.parentId;
        return emailData;
    }

    // saveEmail function for saving the email to the database
    // - it saves the email to the database
    async saveEmail(emailData: EmailData): Promise<EmailData> {
        // Do some validation here
        return await this.createEmail(emailData);
    }

    // exchangeExists function for checking if the exchange exists
    // - it checks if the exchange exists
    async exchangeExists(parentID: string): Promise<boolean> {
        const result = await this.db
            .select()
            .from(inboxData)
            .where(eq(inboxData.parentId, parentID));
        return result.length > 0;
    }

    // messageExistsInExchange function for checking if the message exists in the exchange
    async messageExistsInExchange(messageID: string, parentID: string): Promise<boolean> {
        const result = await this.db
            .select()
            .from(inboxData)
            .where(and(eq(inboxData.messageId, messageID), eq(inboxData.parentId, parentID)));
        return result.length > 0;
    }

    // getLatestMessageInExchange function for getting the latest message in the exchange
    async getLatestMessageInExchange(parentID: string): Promise<EmailData | null> {
        const result = await this.db
            .select()
            .from(inboxData)
            .where(eq(inboxData.parentId, parentID))
            .orderBy(desc(inboxData.timestamp))
            .limit(1);
        return result.length > 0 ? result[0] : null;
    }

    // getAllMessagesInExchange function for getting all the messages in the exchange
    async getAllMessagesInExchange(parentID: string): Promise<EmailData[] | null> {
        const result = await this.db
            .select()
            .from(inboxData)
            .where(eq(inboxData.parentId, parentID))
            .orderBy(asc(inboxData.timestamp));
        return result.length > 0 ? result : null;
    }

    // isFirstMessageInExchange function for checking if the email is the first message in the exchange
    async isFirstMessageInExchange(emailData: EmailData): Promise<boolean> {
        if (!emailData.previousMessageId) {
            return true;
        }

        const previousMessageExists = await this.messageExistsInExchange(
            emailData.previousMessageId,
            emailData.parentId,
        );

        return !previousMessageExists;
    }

    // canBranchExchange function for checking if the email can branch the exchange
    // exchange can move only forward and cannot have branches from the past
    async canBranchExchange(emailData: EmailData): Promise<boolean> {
        // Get the latest message in the exchange
        const latestMessage = await this.getLatestMessageInExchange(emailData.parentId);
        if (!latestMessage) {
            // If there is no latest message, we can branch the exchange
            return true;
        }

        // Enable engagement if the latest message is the previous message
        return latestMessage.messageId === emailData.previousMessageId;
    }

    // Get all emails in a thread (by parentId) ordered by timestamp
    async getEmailsByParentId(parentId: string, ascending: boolean = true) {
        const orderBy = ascending ? asc(inboxData.timestamp) : desc(inboxData.timestamp);

        return await this.db
            .select()
            .from(inboxData)
            .where(eq(inboxData.parentId, parentId))
            .orderBy(orderBy);
    }

    // Get an email by messageId
    async getByMessageId(messageId: string) {
        const result = await this.db
            .select()
            .from(inboxData)
            .where(eq(inboxData.messageId, messageId))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        return result[0];
    }

    // Get emails by previous message ID (find replies)
    async getByPreviousMessageId(previousMessageId: string) {
        return await this.db
            .select()
            .from(inboxData)
            .where(eq(inboxData.previousMessageId, previousMessageId))
            .orderBy(desc(inboxData.timestamp));
    }

    // Get last email in an exchange (by parentId)
    async getLastEmailInExchange(parentId: string) {
        return await this.db
            .select()
            .from(inboxData)
            .where(eq(inboxData.parentId, parentId))
            .orderBy(desc(inboxData.timestamp))
            .limit(1);
    }

    // Get last inbound email in an exchange (by parentId)
    async getLastInboundEmailInExchange(parentId: string) {
        return await this.db
            .select()
            .from(inboxData)
            .where(and(eq(inboxData.parentId, parentId), eq(inboxData.type, 'inbound')))
            .orderBy(desc(inboxData.timestamp))
            .limit(1);
    }

    // Get last outbound email in an exchange (by parentId)
    async getLastOutboundEmailInExchange(parentId: string) {
        return await this.db
            .select()
            .from(inboxData)
            .where(and(eq(inboxData.parentId, parentId), eq(inboxData.type, 'outbound')))
            .orderBy(desc(inboxData.timestamp))
            .limit(1);
    }

    // Count emails in an exchange (by parentId)
    async countEmailsInExchange(parentId: string) {
        return await this.db
            .select({ count: count() })
            .from(inboxData)
            .where(eq(inboxData.parentId, parentId));
    }

    // Count emails by type (inbound or outbound)
    async countEmailsInExchangeByType(parentId: string, type: 'inbound' | 'outbound') {
        return await this.db
            .select({ count: count() })
            .from(inboxData)
            .where(and(eq(inboxData.parentId, parentId), eq(inboxData.type, type)));
    }

    // Count all email exchanges with a specific sender
    async countEmailExchangesWithSender(sender: string) {
        return await this.db
            .select({ count: count() })
            .from(inboxData)
            .where(eq(inboxData.sender, sender));
    }

    // Get emails by sender
    async listEmailsBySender(
        sender: string,
        limit: number = 10,
        offset: number = 0,
        ascending: boolean = true,
    ) {
        const orderBy = ascending ? asc(inboxData.timestamp) : desc(inboxData.timestamp);
        return await this.db
            .select()
            .from(inboxData)
            .where(eq(inboxData.sender, sender))
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset);
    }

    // Get emails by recipient (searches in recipients array)
    async listEmailsByRecipient(
        recipient: string,
        limit: number = 10,
        offset: number = 0,
        ascending: boolean = true,
    ) {
        const orderBy = ascending ? asc(inboxData.timestamp) : desc(inboxData.timestamp);
        return await this.db
            .select()
            .from(inboxData)
            .where(sql`${inboxData.recipients} @> ${JSON.stringify([recipient])}`)
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset);
    }

    // Get emails involving specific participants (sender OR recipient)
    async listEmailsByParticipant(
        email: string,
        limit: number = 10,
        offset: number = 0,
        ascending: boolean = true,
    ) {
        const orderBy = ascending ? asc(inboxData.timestamp) : desc(inboxData.timestamp);

        return await this.db
            .select()
            .from(inboxData)
            .where(
                or(
                    eq(inboxData.sender, email),
                    sql`${inboxData.recipients} @> ${JSON.stringify([email])}`,
                ),
            )
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset);
    }

    // searchEmails involves searching for emails using search predicates
    async searchEmails(filters: InboxFilters) {
        let conditions = [];

        if (filters.parentId) {
            conditions.push(
                or(eq(inboxData.id, filters.parentId), eq(inboxData.parentId, filters.parentId)),
            );
        }

        if (filters.type) {
            conditions.push(eq(inboxData.type, filters.type));
        }

        if (filters.sender) {
            conditions.push(eq(inboxData.sender, filters.sender));
        }

        if (filters.recipient) {
            conditions.push(sql`${inboxData.recipients} @> ${JSON.stringify([filters.recipient])}`);
        }

        if (filters.subject) {
            conditions.push(sql`${inboxData.subject} ILIKE ${'%' + filters.subject + '%'}`);
        }

        if (filters.startDate) {
            conditions.push(sql`${inboxData.timestamp} >= ${filters.startDate}`);
        }

        if (filters.endDate) {
            conditions.push(sql`${inboxData.timestamp} <= ${filters.endDate}`);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        return await this.db
            .select()
            .from(inboxData)
            .where(whereClause)
            .orderBy(desc(inboxData.timestamp))
            .limit(filters.limit)
            .offset(filters.offset);
    }

    async createEmail(data: CreateInboxData): Promise<EmailData> {
        const [newEmail] = await this.db
            .insert(inboxData)
            .values({
                ...data,
                updatedAt: sql`NOW()`,
            })
            .returning();

        return {
            ...newEmail,
            timestamp: newEmail.timestamp,
        };
    }
}
