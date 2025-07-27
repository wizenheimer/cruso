import { EmailData, ExchangeData } from '@/types/exchange';
import { db } from '@/db';
import { exchangeData } from '@/db/schema/exchange';
import { user } from '@/db/schema/auth';
import { and, asc, count, desc, eq, or, sql } from 'drizzle-orm';
import { CreateExchangeData, ExchangeFilters } from '@/types/exchange';

const MAX_EMAILS_IN_EXCHANGE = 25;

export class ExchangeDataService {
    private static instance: ExchangeDataService | null = null;
    private db: typeof db;

    private constructor() {
        this.db = db;
    }

    public static getInstance(): ExchangeDataService {
        if (!ExchangeDataService.instance) {
            ExchangeDataService.instance = new ExchangeDataService();
        }
        return ExchangeDataService.instance;
    }

    // ============================================================================
    // DATABASE OPERATIONS
    // ============================================================================

    /**
     * Convert EmailData to ExchangeData for database storage
     * @param emailData - The email data to convert
     * @param exchangeOwnerId - The user ID who owns this exchange
     * @returns ExchangeData - The exchange data for database storage
     */
    private convertToExchangeData(emailData: EmailData, exchangeOwnerId: string): ExchangeData {
        const { subject, body, ...rest } = emailData;
        return {
            ...rest,
            exchangeOwnerId,
        };
    }

    /**
     * Save an email to the database
     * @param emailData - The email data to save
     * @param exchangeOwnerId - The user ID who owns this exchange
     * @returns Promise<ExchangeData> - The saved email data
     */
    async saveEmail(emailData: EmailData, exchangeOwnerId: string): Promise<ExchangeData> {
        const exchangeDataForDb = this.convertToExchangeData(emailData, exchangeOwnerId);
        const [savedExchangeData] = await this.db
            .insert(exchangeData)
            .values(exchangeDataForDb)
            .returning();

        return savedExchangeData;
    }

    /**
     * Create a new email in the database
     * @param data - The email data to create
     * @returns Promise<ExchangeData> - The created email data
     */
    async createEmail(data: CreateExchangeData): Promise<ExchangeData> {
        const [newExchangeData] = await this.db.insert(exchangeData).values(data).returning();

        return newExchangeData;
    }

    // ============================================================================
    // EXCHANGE MANAGEMENT
    // ============================================================================

    /**
     * Get the signature for an exchange
     * @param exchangeId - The exchange ID to retrieve
     * @returns Promise<string>
     */
    async getSignature(exchangeId: string): Promise<string> {
        const [exchangeOwner] = await this.db
            .select({
                exchangeOwnerId: exchangeData.exchangeOwnerId,
                userEmail: user.email,
            })
            .from(exchangeData)
            .leftJoin(user, eq(exchangeData.exchangeOwnerId, user.id))
            .where(eq(exchangeData.exchangeId, exchangeId))
            .limit(1);

        // If the exchange owner is a user, get the user preferences to retrieve the signature
        if (exchangeOwner && exchangeOwner.exchangeOwnerId) {
            // Get user preferences to retrieve the signature
            const { getUserPreferences } = await import('@/db/queries/preferences');
            const userPreferences = await getUserPreferences(exchangeOwner.exchangeOwnerId);

            if (userPreferences?.signature) {
                return `Best,\n${userPreferences.signature}`;
            }

            // Fallback to the original logic if no signature is set
            return `Best,\n${exchangeOwner.userEmail}'s AI Assistant`;
        }

        return `Best,\nCruso`;
    }

    /**
     * Get the signature for a user id
     * @param userId - The user ID to retrieve the signature for
     * @returns Promise<string>
     */
    async getSignatureForExchangeOwner(exchangeOwnerId: string): Promise<string> {
        const { getUserPreferences } = await import('@/db/queries/preferences');
        const userPreferences = await getUserPreferences(exchangeOwnerId);
        return `Best,\n${userPreferences?.signature || 'Cruso'}`;
    }

    /**
     * Associate an exchange with a user (used for acting on behalf of users)
     * @param exchangeId - The exchange ID to associate
     * @param userEmail - The user's email
     * @returns Promise<void>
     */
    async associateExchangeWithUser(exchangeId: string, userEmail: string): Promise<void> {
        const { getUserByEmail } = await import('@/db/queries/users');
        const user = await getUserByEmail(userEmail);

        if (user) {
            // Check if exchange already has an owner
            const [existingExchange] = await this.db
                .select({ exchangeOwnerId: exchangeData.exchangeOwnerId })
                .from(exchangeData)
                .where(eq(exchangeData.exchangeId, exchangeId))
                .limit(1);

            if (!existingExchange?.exchangeOwnerId) {
                // Update the exchange to set the owner
                await this.db
                    .update(exchangeData)
                    .set({ exchangeOwnerId: user.id })
                    .where(eq(exchangeData.exchangeId, exchangeId));
            }
        }
    }

    /**
     * Get exchange by ID
     * @param exchangeId - The exchange ID to retrieve
     * @returns Promise<ExchangeData | null>
     */
    async getExchange(exchangeId: string) {
        const [result] = await this.db
            .select()
            .from(exchangeData)
            .where(eq(exchangeData.exchangeId, exchangeId))
            .limit(1);

        return result || null;
    }

    // ============================================================================
    // QUERY METHODS
    // ============================================================================

    /**
     * Check if an exchange exists
     * @param exchangeID - The exchange ID to check
     * @returns Promise<boolean> - Whether the exchange exists
     */
    async exchangeExists(exchangeID: string): Promise<boolean> {
        const result = await this.db
            .select()
            .from(exchangeData)
            .where(eq(exchangeData.exchangeId, exchangeID));
        return result.length > 0;
    }

    /**
     * Check if a message exists in an exchange
     * @param messageID - The message ID to check
     * @param exchangeID - The exchange ID to check
     * @returns Promise<boolean> - Whether the message exists in the exchange
     */
    async messageExistsInExchange(messageID: string, exchangeID: string): Promise<boolean> {
        const result = await this.db
            .select()
            .from(exchangeData)
            .where(
                and(eq(exchangeData.messageId, messageID), eq(exchangeData.exchangeId, exchangeID)),
            );
        return result.length > 0;
    }

    /**
     * Get the latest message in an exchange
     * @param exchangeID - The exchange ID to get the latest message for
     * @returns Promise<ExchangeData | null> - The latest message in the exchange
     */
    async getLatestMessageInExchange(exchangeID: string): Promise<ExchangeData | null> {
        const result = await this.db
            .select()
            .from(exchangeData)
            .where(eq(exchangeData.exchangeId, exchangeID))
            .orderBy(desc(exchangeData.timestamp))
            .limit(1);
        return result.length > 0 ? result[0] : null;
    }

    /**
     * Get all messages in an exchange
     * @param exchangeID - The exchange ID to get all messages for
     * @returns Promise<ExchangeData[] | null> - All messages in the exchange
     */
    async getAllMessagesInExchange(exchangeID: string): Promise<ExchangeData[] | null> {
        const result = await this.db
            .select()
            .from(exchangeData)
            .where(eq(exchangeData.exchangeId, exchangeID))
            .orderBy(asc(exchangeData.timestamp));
        return result.length > 0 ? result : null;
    }

    /**
     * Check if an email is the first message in an exchange
     * @param emailData - The email data to check
     * @returns Promise<boolean> - Whether the email is the first message in the exchange
     */
    async isFirstMessageInExchange(emailData: EmailData): Promise<boolean> {
        const messagesInExchange = await this.getAllMessagesInExchange(emailData.exchangeId);
        if (!messagesInExchange || messagesInExchange.length === 0) {
            return true;
        }

        const firstMessage = messagesInExchange[0];
        return firstMessage.id === emailData.id;
    }

    /**
     * Check if an email is a valid engagement
     * @param emailData - The email data to check
     * @returns Promise<boolean> - Whether the email is a valid engagement
     */
    async isValidEngagement(emailData: EmailData): Promise<boolean> {
        const messagesInExchange = await this.getAllMessagesInExchange(emailData.exchangeId);
        if (!messagesInExchange) {
            return false;
        }

        // Check if the exchange has more than MAX_EMAILS_IN_EXCHANGE messages
        if (messagesInExchange.length > MAX_EMAILS_IN_EXCHANGE) {
            return false;
        }

        // Check if the exchange is older than 30 days
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago in milliseconds

        const firstMessage = messagesInExchange[0];
        if (firstMessage.timestamp < thirtyDaysAgo) {
            return false;
        }

        return true;
    }

    /**
     * Get an email by message ID
     * @param messageId - The message ID to get the email for
     * @returns Promise<ExchangeData | null> - The email with the specified message ID
     */
    async getByMessageId(messageId: string): Promise<ExchangeData | null> {
        const result = await this.db
            .select()
            .from(exchangeData)
            .where(eq(exchangeData.messageId, messageId))
            .limit(1);

        return result.length > 0 ? result[0] : null;
    }

    /**
     * Get emails by previous message ID
     * @param previousMessageId - The previous message ID to get emails for
     * @returns Promise<ExchangeData[]> - Array of emails with the specified previous message ID
     */
    async getByPreviousMessageId(previousMessageId: string): Promise<ExchangeData[]> {
        const result = await this.db
            .select()
            .from(exchangeData)
            .where(eq(exchangeData.previousMessageId, previousMessageId))
            .orderBy(desc(exchangeData.timestamp));

        return result;
    }

    /**
     * Get the last email in an exchange
     * @param exchangeId - The exchange ID to get the last email for
     * @returns Promise<ExchangeData | null> - The last email in the exchange
     */
    async getLastEmailInExchange(exchangeId: string): Promise<ExchangeData | null> {
        const result = await this.db
            .select()
            .from(exchangeData)
            .where(eq(exchangeData.exchangeId, exchangeId))
            .orderBy(desc(exchangeData.timestamp))
            .limit(1);

        return result.length > 0 ? result[0] : null;
    }

    /**
     * Get the last inbound email in an exchange
     * @param exchangeId - The exchange ID to get the last inbound email for
     * @returns Promise<ExchangeData | null> - The last inbound email in the exchange
     */
    async getLastInboundEmailInExchange(exchangeId: string): Promise<ExchangeData | null> {
        const result = await this.db
            .select()
            .from(exchangeData)
            .where(and(eq(exchangeData.exchangeId, exchangeId), eq(exchangeData.type, 'inbound')))
            .orderBy(desc(exchangeData.timestamp))
            .limit(1);

        return result.length > 0 ? result[0] : null;
    }

    /**
     * Get the last outbound email in an exchange
     * @param exchangeId - The exchange ID to get the last outbound email for
     * @returns Promise<ExchangeData | null> - The last outbound email in the exchange
     */
    async getLastOutboundEmailInExchange(exchangeId: string): Promise<ExchangeData | null> {
        const result = await this.db
            .select()
            .from(exchangeData)
            .where(and(eq(exchangeData.exchangeId, exchangeId), eq(exchangeData.type, 'outbound')))
            .orderBy(desc(exchangeData.timestamp))
            .limit(1);

        return result.length > 0 ? result[0] : null;
    }

    /**
     * Count emails in an exchange
     * @param exchangeId - The exchange ID to count emails for
     * @returns Promise<{ count: number }[]> - The count of emails in the exchange
     */
    async countEmailsInExchange(exchangeId: string): Promise<{ count: number }[]> {
        return await this.db
            .select({ count: count() })
            .from(exchangeData)
            .where(eq(exchangeData.exchangeId, exchangeId));
    }

    /**
     * Count emails in an exchange by type
     * @param exchangeId - The exchange ID to count emails for
     * @param type - The type of emails to count
     * @returns Promise<{ count: number }[]> - The count of emails in the exchange by type
     */
    async countEmailsInExchangeByType(
        exchangeId: string,
        type: 'inbound' | 'outbound',
    ): Promise<{ count: number }[]> {
        return await this.db
            .select({ count: count() })
            .from(exchangeData)
            .where(and(eq(exchangeData.exchangeId, exchangeId), eq(exchangeData.type, type)));
    }

    /**
     * Count email exchanges with a sender
     * @param sender - The sender to count exchanges for
     * @returns Promise<{ count: number }[]> - The count of exchanges with the sender
     */
    async countEmailExchangesWithSender(sender: string): Promise<{ count: number }[]> {
        return await this.db
            .select({ count: count() })
            .from(exchangeData)
            .where(eq(exchangeData.sender, sender));
    }

    /**
     * List emails by sender
     * @param sender - The sender to list emails for
     * @param limit - The maximum number of emails to return (default: 10)
     * @param offset - The number of emails to skip (default: 0)
     * @param ascending - Whether to order by ascending timestamp (default: true)
     * @returns Promise<ExchangeData[]> - Array of emails from the sender
     */
    async listEmailsBySender(
        sender: string,
        limit: number = 10,
        offset: number = 0,
        ascending: boolean = true,
    ): Promise<ExchangeData[]> {
        const orderBy = ascending ? asc(exchangeData.timestamp) : desc(exchangeData.timestamp);
        const result = await this.db
            .select()
            .from(exchangeData)
            .where(eq(exchangeData.sender, sender))
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset);

        return result;
    }

    /**
     * List emails by recipient
     * @param recipient - The recipient to list emails for
     * @param limit - The maximum number of emails to return (default: 10)
     * @param offset - The number of emails to skip (default: 0)
     * @param ascending - Whether to order by ascending timestamp (default: true)
     * @returns Promise<ExchangeData[]> - Array of emails to the recipient
     */
    async listEmailsByRecipient(
        recipient: string,
        limit: number = 10,
        offset: number = 0,
        ascending: boolean = true,
    ): Promise<ExchangeData[]> {
        const orderBy = ascending ? asc(exchangeData.timestamp) : desc(exchangeData.timestamp);
        const result = await this.db
            .select()
            .from(exchangeData)
            .where(sql`${exchangeData.recipients} @> ${JSON.stringify([recipient])}`)
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset);

        return result;
    }

    /**
     * List emails by participant (sender or recipient)
     * @param email - The email address to list emails for
     * @param limit - The maximum number of emails to return (default: 10)
     * @param offset - The number of emails to skip (default: 0)
     * @param ascending - Whether to order by ascending timestamp (default: true)
     * @returns Promise<ExchangeData[]> - Array of emails involving the specified participant
     */
    async listEmailsByParticipant(
        email: string,
        limit: number = 10,
        offset: number = 0,
        ascending: boolean = true,
    ): Promise<ExchangeData[]> {
        const orderBy = ascending ? asc(exchangeData.timestamp) : desc(exchangeData.timestamp);

        const result = await this.db
            .select()
            .from(exchangeData)
            .where(
                or(
                    eq(exchangeData.sender, email),
                    sql`${exchangeData.recipients} @> ${JSON.stringify([email])}`,
                ),
            )
            .orderBy(orderBy)
            .limit(limit)
            .offset(offset);

        return result;
    }

    /**
     * Search emails using various filters and predicates
     * @param filters - The search filters to apply
     * @returns Promise<ExchangeData[]> - Array of emails matching the search criteria
     */
    async searchEmails(filters: ExchangeFilters): Promise<ExchangeData[]> {
        let conditions = [];

        if (filters.exchangeId) {
            conditions.push(
                or(
                    eq(exchangeData.id, filters.exchangeId),
                    eq(exchangeData.exchangeId, filters.exchangeId),
                ),
            );
        }

        if (filters.exchangeOwnerId) {
            conditions.push(eq(exchangeData.exchangeOwnerId, filters.exchangeOwnerId));
        }

        if (filters.type) {
            conditions.push(eq(exchangeData.type, filters.type));
        }

        if (filters.sender) {
            conditions.push(eq(exchangeData.sender, filters.sender));
        }

        if (filters.recipient) {
            conditions.push(
                sql`${exchangeData.recipients} @> ${JSON.stringify([filters.recipient])}`,
            );
        }

        if (filters.startDate) {
            const startTimestamp = new Date(filters.startDate).getTime();
            conditions.push(sql`${exchangeData.timestamp} >= ${startTimestamp}`);
        }

        if (filters.endDate) {
            const endTimestamp = new Date(filters.endDate).getTime();
            conditions.push(sql`${exchangeData.timestamp} <= ${endTimestamp}`);
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

        const result = await this.db
            .select()
            .from(exchangeData)
            .where(whereClause)
            .orderBy(desc(exchangeData.timestamp))
            .limit(filters.limit)
            .offset(filters.offset);

        return result;
    }
}
