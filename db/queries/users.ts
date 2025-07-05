import { db } from '@/db';
import { users } from '@/db/schema/users';
import { User } from '@/types/api/users';
import { eq } from 'drizzle-orm';

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
};
