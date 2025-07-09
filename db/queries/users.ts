import { db } from '@/db';
import { user } from '@/db/schema/auth';
import { User } from '@/types/api/users';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const [userRecord] = await db.select().from(user).where(eq(user.email, email));
    return userRecord;
};

export const createUserWithEmail = async (email: string): Promise<User | null> => {
    console.log('attempting to create user', { email });
    const [userRecord] = await db
        .insert(user)
        .values({
            id: randomUUID(),
            // Use email prefix as name, fallback to full email
            name: email.includes('@') ? email.split('@')[0] : email,
            email,
        })
        .returning();
    console.log('created user in db', { userRecord });
    return userRecord;
};
