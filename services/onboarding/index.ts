import { User } from '@/types/api/users';
import { EmailService } from '../email';
import { EmailData } from '../inbox/content';
import { v4 as uuidv4 } from 'uuid';

export class OnboardingService {
    private static instance: OnboardingService | null = null;
    private senderEmail: string;

    private constructor() {
        this.senderEmail = process.env.SENDER_EMAIL || 'cruso@crusolabs.com';
    }

    public static getInstance(): OnboardingService {
        if (!OnboardingService.instance) {
            OnboardingService.instance = new OnboardingService();
        }
        return OnboardingService.instance;
    }

    async sendWelcomeEmail(user: User): Promise<boolean> {
        const emailService = EmailService.getInstance();
        const emailData: EmailData = {
            sender: this.senderEmail,
            recipients: [user.email],
            subject: 'And the journey begins...',
            body: 'Welcome to Cruso!',
            id: uuidv4(),
            parentID: uuidv4(),
            messageID: uuidv4(),
            previousMessageID: uuidv4(),
            timestamp: Date.now(),
        };
        const emailResponse = await emailService.sendEmail(emailData);
        return emailResponse.success;
    }
}
