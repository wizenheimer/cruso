import { db } from '@/db';
import { exchangeOwners } from '@/db/schema/exchange-owners';
import { user } from '@/db/schema/auth';
import { eq } from 'drizzle-orm';

export const getExchangeOwner = async (exchangeId: string) => {
    const [result] = await db
        .select({
            exchangeId: exchangeOwners.exchangeId,
            userId: exchangeOwners.userId,
            userEmail: user.email,
            exchangeType: exchangeOwners.exchangeType,
        })
        .from(exchangeOwners)
        .innerJoin(user, eq(exchangeOwners.userId, user.id))
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

export const createExchangeOwner = async (exchangeId: string, userId: string) => {
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
