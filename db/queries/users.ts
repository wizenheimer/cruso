import { db } from '@/db';
import { user } from '@/db/schema/auth';
import { User } from '@/types/users';
import { eq } from 'drizzle-orm';

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const [userRecord] = await db.select().from(user).where(eq(user.email, email));
    return userRecord;
};
