import { EmailData, ExchangeData } from './types';
import { ExchangeDataService } from './exchangeDataService';
import { ExchangeProcessingService } from './exchangeProcessingService';
import { CreateExchangeData, ExchangeFilters } from '@/types/api/exchange';
import { User } from '@/types/api/users';

export class ExchangeService {
    private static instance: ExchangeService | null = null;
    private exchangeDataService: ExchangeDataService;
    private exchangeProcessingService: ExchangeProcessingService;

    private constructor() {
        this.exchangeDataService = ExchangeDataService.getInstance();
        this.exchangeProcessingService = ExchangeProcessingService.getInstance();
    }

    public static getInstance(): ExchangeService {
        if (!ExchangeService.instance) {
            ExchangeService.instance = new ExchangeService();
        }
        return ExchangeService.instance;
    }

    // ============================================================================
    // FACADE METHODS - DELEGATE TO APPROPRIATE SERVICE
    // ============================================================================

    // Email Processing Methods
    async processEmail(c: any): Promise<EmailData> {
        return this.exchangeProcessingService.processEmail(c);
    }

    // Exchange Handling Methods
    async handleNewUser(inboundEmailData: EmailData) {
        return this.exchangeProcessingService.handleNewUser(inboundEmailData);
    }

    async handleInvalidEngagementForExistingUser(inboundEmailData: EmailData, user: User) {
        return this.exchangeProcessingService.handleInvalidEngagementForExistingUser(
            inboundEmailData,
            user,
        );
    }

    async handleInvalidEngagementForNonUser(inboundEmailData: EmailData) {
        return this.exchangeProcessingService.handleInvalidEngagementForNonUser(inboundEmailData);
    }

    async handleEngagementForNonUser(emailData: EmailData) {
        return this.exchangeProcessingService.handleEngagementForNonUser(emailData);
    }

    async handleEngagementForExistingUser(emailData: EmailData, user: User) {
        return this.exchangeProcessingService.handleEngagementForExistingUser(emailData, user);
    }

    // Database Operations
    async saveEmail(emailData: EmailData, exchangeOwnerId: string): Promise<ExchangeData> {
        return this.exchangeDataService.saveEmail(emailData, exchangeOwnerId);
    }

    async createEmail(data: CreateExchangeData): Promise<ExchangeData> {
        return this.exchangeDataService.createEmail(data);
    }

    // Exchange Management
    async getSignature(exchangeId: string): Promise<string> {
        return this.exchangeDataService.getSignature(exchangeId);
    }

    async associateExchangeWithUser(exchangeId: string, userEmail: string): Promise<void> {
        return this.exchangeDataService.associateExchangeWithUser(exchangeId, userEmail);
    }

    async getExchange(exchangeId: string) {
        return this.exchangeDataService.getExchange(exchangeId);
    }

    // Query Methods
    async exchangeExists(exchangeID: string): Promise<boolean> {
        return this.exchangeDataService.exchangeExists(exchangeID);
    }

    async messageExistsInExchange(messageID: string, exchangeID: string): Promise<boolean> {
        return this.exchangeDataService.messageExistsInExchange(messageID, exchangeID);
    }

    async getLatestMessageInExchange(exchangeID: string): Promise<ExchangeData | null> {
        return this.exchangeDataService.getLatestMessageInExchange(exchangeID);
    }

    async getAllMessagesInExchange(exchangeID: string): Promise<ExchangeData[] | null> {
        return this.exchangeDataService.getAllMessagesInExchange(exchangeID);
    }

    async isFirstMessageInExchange(emailData: EmailData): Promise<boolean> {
        return this.exchangeDataService.isFirstMessageInExchange(emailData);
    }

    async isValidEngagement(emailData: EmailData): Promise<boolean> {
        return this.exchangeDataService.isValidEngagement(emailData);
    }

    async getByMessageId(messageId: string): Promise<ExchangeData | null> {
        return this.exchangeDataService.getByMessageId(messageId);
    }

    async getByPreviousMessageId(previousMessageId: string): Promise<ExchangeData[]> {
        return this.exchangeDataService.getByPreviousMessageId(previousMessageId);
    }

    async getLastEmailInExchange(exchangeId: string): Promise<ExchangeData | null> {
        return this.exchangeDataService.getLastEmailInExchange(exchangeId);
    }

    async getLastInboundEmailInExchange(exchangeId: string): Promise<ExchangeData | null> {
        return this.exchangeDataService.getLastInboundEmailInExchange(exchangeId);
    }

    async getLastOutboundEmailInExchange(exchangeId: string): Promise<ExchangeData | null> {
        return this.exchangeDataService.getLastOutboundEmailInExchange(exchangeId);
    }

    async countEmailsInExchange(exchangeId: string): Promise<{ count: number }[]> {
        return this.exchangeDataService.countEmailsInExchange(exchangeId);
    }

    async countEmailsInExchangeByType(
        exchangeId: string,
        type: 'inbound' | 'outbound',
    ): Promise<{ count: number }[]> {
        return this.exchangeDataService.countEmailsInExchangeByType(exchangeId, type);
    }

    async countEmailExchangesWithSender(sender: string): Promise<{ count: number }[]> {
        return this.exchangeDataService.countEmailExchangesWithSender(sender);
    }

    async listEmailsBySender(
        sender: string,
        limit: number = 10,
        offset: number = 0,
        ascending: boolean = true,
    ): Promise<ExchangeData[]> {
        return this.exchangeDataService.listEmailsBySender(sender, limit, offset, ascending);
    }

    async listEmailsByRecipient(
        recipient: string,
        limit: number = 10,
        offset: number = 0,
        ascending: boolean = true,
    ): Promise<ExchangeData[]> {
        return this.exchangeDataService.listEmailsByRecipient(recipient, limit, offset, ascending);
    }

    async listEmailsByParticipant(
        email: string,
        limit: number = 10,
        offset: number = 0,
        ascending: boolean = true,
    ): Promise<ExchangeData[]> {
        return this.exchangeDataService.listEmailsByParticipant(email, limit, offset, ascending);
    }

    async searchEmails(filters: ExchangeFilters): Promise<ExchangeData[]> {
        return this.exchangeDataService.searchEmails(filters);
    }
}
