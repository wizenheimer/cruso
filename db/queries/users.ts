import { db } from '@/db';
import { users } from '@/db/schema/users';
import { User } from '@/types/api/users';
import { eq } from 'drizzle-orm';

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
};

export const createUser = async (email: string): Promise<User | null> => {
    console.log('attempting to create user', { email });
    const [user] = await db.insert(users).values({ email }).returning();
    console.log('created user in db', { user });
    return user;
};
