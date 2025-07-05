import { insertUserSchema, users } from '@/db/schema/users';
import z from 'zod';

export const CreateUserSchema = insertUserSchema
    .pick({
        email: true,
    })
    .extend({
        displayName: z.string().optional(),
        nickname: z.string().optional(),
    });

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
