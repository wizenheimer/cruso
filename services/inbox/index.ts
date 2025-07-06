import { EmailData, RawEmailData } from './types';
import { db } from '@/db';
import { inboxData } from '@/db/schema/inbox';
import { EmailParsingService } from './parsing';
import { and, asc, count, desc, eq, or, sql } from 'drizzle-orm';
import { CreateInboxData, InboxFilters } from '@/types/api/inbox';
import { Context } from 'hono';
import { uuidv4 } from 'zod/v4';
import { generatePrefixForBody } from './parsing/text';

export class InboxService {
    private static instance: InboxService | null = null;
    private db: typeof db;
    private emailParsingService: EmailParsingService;

    private constructor() {
        this.db = db;
        this.emailParsingService = EmailParsingService.getInstance();
    }

    public static getInstance(): InboxService {
        if (!InboxService.instance) {
            InboxService.instance = new InboxService();
        }
        return InboxService.instance;
    }

    /**
     * Process incoming emails and determine if they are new or part of existing threads
     * @param c - The Hono context containing the email data
     * @returns Promise<EmailData> - The processed email data with appropriate threading information
     */
    async processEmail(c: Context): Promise<EmailData> {
        const rawEmailData = await this.emailParsingService.parseEmail(c);

        const previousMessageID = rawEmailData.previousMessageId;
        if (!previousMessageID) {
            return this.newEmailWithoutPriors(rawEmailData);
        }

        // Check if the previous message exists
        const previousMessage = await this.getByMessageId(previousMessageID);
        if (!previousMessage) {
            return this.newEmailWithoutPriors(rawEmailData);
        }

        return this.emailWithPriors(rawEmailData, previousMessage);
    }

    /**
     * Create an email without priors
     * @param rawEmailData - The raw email data
     * @returns Promise<EmailData> - The email data with a new id and parentId
     */
    private async newEmailWithoutPriors(rawEmailData: RawEmailData): Promise<EmailData> {
        const bodyPrefix = generatePrefixForBody(
            { name: rawEmailData.sender, address: rawEmailData.sender },
            rawEmailData.timestamp,
        );
        const emailData = {
            ...rawEmailData,
            id: uuidv4().toString(),
            parentId: uuidv4().toString(),
            subject: rawEmailData.rawSubject, // Left unaltered to support threading on Client
            body: bodyPrefix + rawEmailData.rawBody,
        };
        return emailData;
    }

    /**
     * Create an email with priors
     * @param rawEmailData - The raw email data
     * @param priorEmail - The prior email
     * @returns Promise<EmailData> - The email data with the prior email's parentId
     */
    private async emailWithPriors(
        rawEmailData: RawEmailData,
        priorEmail: EmailData,
    ): Promise<EmailData> {
        const bodyPrefix = generatePrefixForBody(
            { name: rawEmailData.sender, address: rawEmailData.sender },
            rawEmailData.timestamp,
        );
        const emailData = {
            ...rawEmailData,
            id: uuidv4().toString(),
            parentId: priorEmail.parentId,
            subject: rawEmailData.rawSubject, // Left unaltered to support threading on Client
            body: bodyPrefix + rawEmailData.rawBody,
        };
        return emailData;
    }

    /**
     * Save the email to the database after validation
     * @param emailData - The email data to save
     * @returns Promise<EmailData> - The saved email data
     */
    async saveEmail(emailData: EmailData): Promise<EmailData> {
        // Do some validation here
        return await this.createEmail(emailData);
    }

    /**
     * Check if an exchange exists by parent ID
     * @param parentID - The parent ID to check for
     * @returns Promise<boolean> - True if the exchange exists, false otherwise
     */
    async exchangeExists(parentID: string): Promise<boolean> {
        const result = await this.db
            .select()
            .from(inboxData)
            .where(eq(inboxData.parentId, parentID));
        return result.length > 0;
    }

    /**
     * Check if a message exists in a specific exchange
     * @param messageID - The message ID to check for
     * @param parentID - The parent ID of the exchange
     * @returns Promise<boolean> - True if the message exists in the exchange, false otherwise
     */
    async messageExistsInExchange(messageID: string, parentID: string): Promise<boolean> {
        const result = await this.db
            .select()
            .from(inboxData)
            .where(and(eq(inboxData.messageId, messageID), eq(inboxData.parentId, parentID)));
        return result.length > 0;
    }

    /**
     * Get the latest message in an exchange
     * @param parentID - The parent ID of the exchange
     * @returns Promise<EmailData | null> - The latest message or null if no messages exist
     */
    async getLatestMessageInExchange(parentID: string): Promise<EmailData | null> {
        const result = await this.db
            .select()
            .from(inboxData)
            .where(eq(inboxData.parentId, parentID))
            .orderBy(desc(inboxData.timestamp))
            .limit(1);
        return result.length > 0 ? result[0] : null;
    }

    /**
     * Get all messages in an exchange
     * @param parentID - The parent ID of the exchange
     * @returns Promise<EmailData[] | null> - Array of all messages or null if no messages exist
     */
    async getAllMessagesInExchange(parentID: string): Promise<EmailData[] | null> {
        const result = await this.db
            .select()
            .from(inboxData)
            .where(eq(inboxData.parentId, parentID))
            .orderBy(asc(inboxData.timestamp));
        return result.length > 0 ? result : null;
    }

    /**
     * Check if the email is the first message in the exchange
     * @param emailData - The email data to check
     * @returns Promise<boolean> - True if it's the first message, false otherwise
     */
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

    /**
     * Check if the email is a valid engagement in the exchange
     * Exchange can move only forward and cannot have branches from the past
     * @param emailData - The email data to validate
     * @returns Promise<boolean> - True if it's a valid engagement, false otherwise
     */
    async isValidEngagement(emailData: EmailData): Promise<boolean> {
        // Get the latest message in the exchange
        const latestMessage = await this.getLatestMessageInExchange(emailData.parentId);
        if (!latestMessage) {
            // If there is no latest message, we can branch the exchange
            return true;
        }

        // Enable engagement if the latest message is the previous message
        return latestMessage.messageId === emailData.previousMessageId;
    }

    /**
     * Get all emails in a thread (by parentId) ordered by timestamp
     * @param parentId - The parent ID of the thread
     * @param ascending - Whether to order by ascending timestamp (default: true)
     * @returns Promise<EmailData[]> - Array of emails in the thread
     */
    async getEmailsByParentId(parentId: string, ascending: boolean = true) {
        const orderBy = ascending ? asc(inboxData.timestamp) : desc(inboxData.timestamp);

        return await this.db
            .select()
            .from(inboxData)
            .where(eq(inboxData.parentId, parentId))
            .orderBy(orderBy);
    }

    /**
     * Get an email by message ID
     * @param messageId - The message ID to search for
     * @returns Promise<EmailData | null> - The email data or null if not found
     */
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

    /**
     * Get emails by previous message ID (find replies)
     * @param previousMessageId - The previous message ID to search for
     * @returns Promise<EmailData[]> - Array of emails that are replies to the specified message
     */
    async getByPreviousMessageId(previousMessageId: string) {
        return await this.db
            .select()
            .from(inboxData)
            .where(eq(inboxData.previousMessageId, previousMessageId))
            .orderBy(desc(inboxData.timestamp));
    }

    /**
     * Get the last email in an exchange (by parentId)
     * @param parentId - The parent ID of the exchange
     * @returns Promise<EmailData[]> - Array containing the last email or empty array if none found
     */
    async getLastEmailInExchange(parentId: string) {
        return await this.db
            .select()
            .from(inboxData)
            .where(eq(inboxData.parentId, parentId))
            .orderBy(desc(inboxData.timestamp))
            .limit(1);
    }

    /**
     * Get the last inbound email in an exchange (by parentId)
     * @param parentId - The parent ID of the exchange
     * @returns Promise<EmailData[]> - Array containing the last inbound email or empty array if none found
     */
    async getLastInboundEmailInExchange(parentId: string) {
        return await this.db
            .select()
            .from(inboxData)
            .where(and(eq(inboxData.parentId, parentId), eq(inboxData.type, 'inbound')))
            .orderBy(desc(inboxData.timestamp))
            .limit(1);
    }

    /**
     * Get the last outbound email in an exchange (by parentId)
     * @param parentId - The parent ID of the exchange
     * @returns Promise<EmailData[]> - Array containing the last outbound email or empty array if none found
     */
    async getLastOutboundEmailInExchange(parentId: string) {
        return await this.db
            .select()
            .from(inboxData)
            .where(and(eq(inboxData.parentId, parentId), eq(inboxData.type, 'outbound')))
            .orderBy(desc(inboxData.timestamp))
            .limit(1);
    }

    /**
     * Count emails in an exchange (by parentId)
     * @param parentId - The parent ID of the exchange
     * @returns Promise<{count: number}[]> - Array containing the count of emails
     */
    async countEmailsInExchange(parentId: string) {
        return await this.db
            .select({ count: count() })
            .from(inboxData)
            .where(eq(inboxData.parentId, parentId));
    }

    /**
     * Count emails by type (inbound or outbound) in an exchange
     * @param parentId - The parent ID of the exchange
     * @param type - The type of emails to count ('inbound' or 'outbound')
     * @returns Promise<{count: number}[]> - Array containing the count of emails of the specified type
     */
    async countEmailsInExchangeByType(parentId: string, type: 'inbound' | 'outbound') {
        return await this.db
            .select({ count: count() })
            .from(inboxData)
            .where(and(eq(inboxData.parentId, parentId), eq(inboxData.type, type)));
    }

    /**
     * Count all email exchanges with a specific sender
     * @param sender - The sender email address
     * @returns Promise<{count: number}[]> - Array containing the count of email exchanges
     */
    async countEmailExchangesWithSender(sender: string) {
        return await this.db
            .select({ count: count() })
            .from(inboxData)
            .where(eq(inboxData.sender, sender));
    }

    /**
     * Get emails by sender with pagination and ordering
     * @param sender - The sender email address
     * @param limit - Maximum number of emails to return (default: 10)
     * @param offset - Number of emails to skip (default: 0)
     * @param ascending - Whether to order by ascending timestamp (default: true)
     * @returns Promise<EmailData[]> - Array of emails from the specified sender
     */
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

    /**
     * Get emails by recipient (searches in recipients array) with pagination and ordering
     * @param recipient - The recipient email address
     * @param limit - Maximum number of emails to return (default: 10)
     * @param offset - Number of emails to skip (default: 0)
     * @param ascending - Whether to order by ascending timestamp (default: true)
     * @returns Promise<EmailData[]> - Array of emails to the specified recipient
     */
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

    /**
     * Get emails involving specific participants (sender OR recipient) with pagination and ordering
     * @param email - The email address to search for
     * @param limit - Maximum number of emails to return (default: 10)
     * @param offset - Number of emails to skip (default: 0)
     * @param ascending - Whether to order by ascending timestamp (default: true)
     * @returns Promise<EmailData[]> - Array of emails involving the specified participant
     */
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

    /**
     * Search emails using various filters and predicates
     * @param filters - The search filters to apply
     * @returns Promise<EmailData[]> - Array of emails matching the search criteria
     */
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

    /**
     * Create a new email in the database
     * @param data - The email data to create
     * @returns Promise<EmailData> - The created email data
     */
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
