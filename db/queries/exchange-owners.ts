import { db } from '@/db';
import { exchangeOwners } from '@/db/schema/exchange-owners';
import { users } from '@/db/schema/users';
import { eq, and } from 'drizzle-orm';

export const getExchangeOwner = async (exchangeId: string) => {
    const [result] = await db
        .select({
            exchangeId: exchangeOwners.exchangeId,
            userId: exchangeOwners.userId,
            userEmail: users.email,
            exchangeType: exchangeOwners.exchangeType,
        })
        .from(exchangeOwners)
        .innerJoin(users, eq(exchangeOwners.userId, users.id))
        .where(eq(exchangeOwners.exchangeId, exchangeId));

    return result || null;
};

export const getExchangeById = async (exchangeId: string) => {
    const [result] = await db
        .select()
        .from(exchangeOwners)
        .where(eq(exchangeOwners.exchangeId, exchangeId));

    return result || null;
};

export const createExchangeOwner = async (exchangeId: string, userId: number) => {
    const [result] = await db.insert(exchangeOwners).values({ exchangeId, userId }).returning();

    return result;
};

export const exchangeHasOwner = async (exchangeId: string): Promise<boolean> => {
    const [result] = await db
        .select({ count: exchangeOwners.id })
        .from(exchangeOwners)
        .where(eq(exchangeOwners.exchangeId, exchangeId));

    return !!result;
};
