import { user } from '@/db/schema/auth';

export type User = typeof user.$inferSelect;
export type InsertUser = typeof user.$inferInsert;
export type UpdateUser = typeof user.$inferSelect;
export type DeleteUser = typeof user.$inferSelect;
