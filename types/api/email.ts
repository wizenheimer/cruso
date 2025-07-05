import { insertUserEmailSchema, userEmails } from '@/db/schema/user-emails';

export const EmailAliasSchema = insertUserEmailSchema.pick({
    email: true,
});

export type UserEmail = typeof userEmails.$inferSelect;
export type InsertUserEmail = typeof userEmails.$inferInsert;
