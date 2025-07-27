import { db } from '@/db';
import { allowedList } from '@/db/schema/allowed-list';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Normalize email address for consistent storage and lookup
 */
function normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
}

/**
 * Get allowed list entry by email
 * Handles email normalization and returns the entry if found
 */
export async function getAllowedListEntry(email: string) {
    const normalizedEmail = normalizeEmail(email);

    const [entry] = await db
        .select()
        .from(allowedList)
        .where(eq(allowedList.email, normalizedEmail))
        .limit(1);

    return entry || null;
}

/**
 * Is allowed list entry
 */
export async function isAllowedListEntry(email: string) {
    const normalizedEmail = normalizeEmail(email);
    const entry = await getAllowedListEntry(normalizedEmail);
    return entry?.isAllowed || false;
}

/**
 * Set allowed list entry
 * Handles email normalization and conflicts
 * Only adds if missing (upsert behavior)
 */
export async function setAllowedListEntry(email: string, isAllowed: boolean) {
    const normalizedEmail = normalizeEmail(email);

    // Check if entry already exists
    const existingEntry = await getAllowedListEntry(normalizedEmail);

    if (existingEntry) {
        // Update existing entry if the isAllowed value is different
        if (existingEntry.isAllowed !== isAllowed) {
            const [updatedEntry] = await db
                .update(allowedList)
                .set({
                    isAllowed,
                })
                .where(eq(allowedList.id, existingEntry.id))
                .returning();

            return updatedEntry;
        }

        // Return existing entry if no change needed
        return existingEntry;
    } else {
        // Insert new entry
        const [newEntry] = await db
            .insert(allowedList)
            .values({
                email: normalizedEmail,
                isAllowed,
            })
            .returning();

        return newEntry;
    }
}

/**
 * Get all allowed list entries
 */
export async function getAllAllowedListEntries() {
    return await db.select().from(allowedList).orderBy(allowedList.email);
}

/**
 * Get all allowed emails
 */
export async function getAllowedEmails() {
    const entries = await db
        .select({
            email: allowedList.email,
        })
        .from(allowedList)
        .where(eq(allowedList.isAllowed, true))
        .orderBy(allowedList.email);

    return entries.map((entry) => entry.email);
}

/**
 * Get all blocked emails
 */
export async function getBlockedEmails() {
    const entries = await db
        .select({
            email: allowedList.email,
        })
        .from(allowedList)
        .where(eq(allowedList.isAllowed, false))
        .orderBy(allowedList.email);

    return entries.map((entry) => entry.email);
}

/**
 * Set multiple allowed list entries
 * Handles email normalization and conflicts for a list of emails
 * Only adds if missing (upsert behavior)
 */
export async function setAllowedListEntries(emails: string[], isAllowed: boolean) {
    const normalizedEmails = emails.map(normalizeEmail);

    // Get existing entries for these emails
    const existingEntries = await db
        .select()
        .from(allowedList)
        .where(inArray(allowedList.email, normalizedEmails));

    const existingEmailMap = new Map(existingEntries.map((entry) => [entry.email, entry]));

    const toInsert: Array<{ email: string; isAllowed: boolean }> = [];
    const toUpdate: Array<{ id: number; isAllowed: boolean }> = [];

    for (const email of normalizedEmails) {
        const existing = existingEmailMap.get(email);

        if (existing) {
            // Update if the isAllowed value is different
            if (existing.isAllowed !== isAllowed) {
                toUpdate.push({ id: existing.id, isAllowed });
            }
        } else {
            // Insert new entry
            toInsert.push({ email, isAllowed });
        }
    }

    const results = [];

    // Update existing entries
    if (toUpdate.length > 0) {
        for (const update of toUpdate) {
            const [updatedEntry] = await db
                .update(allowedList)
                .set({ isAllowed: update.isAllowed })
                .where(eq(allowedList.id, update.id))
                .returning();

            if (updatedEntry) {
                results.push(updatedEntry);
            }
        }
    }

    // Insert new entries
    if (toInsert.length > 0) {
        const newEntries = await db.insert(allowedList).values(toInsert).returning();

        results.push(...newEntries);
    }

    return results;
}
