import type { EmailData } from '@/services/inbox/content';
import type { User } from '@/types/api/users';

// Extend Hono's context to include user and email data
declare module 'hono' {
    interface ContextVariableMap {
        user: User | null;
        emailData: EmailData;
    }
}
