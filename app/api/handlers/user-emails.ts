import { Context } from 'hono';
import { db } from '@/db';
import { userEmails } from '@/db/schema/user-emails';
import { eq, and, ne } from 'drizzle-orm';

export const getUser = (c: Context) => {
    const user = c.get('user');
    if (!user) {
        throw new Error('User not found in context');
    }
    return user;
};

/**
 * Handle GET request to fetch user emails
 * @param c - The context object
 * @returns The response object
 */
export async function handleGetUserEmails(c: Context) {
    try {
        const user = getUser(c);

        const emails = await db
            .select({
                id: userEmails.id,
                email: userEmails.email,
                verifiedAt: userEmails.verifiedAt,
                isPrimary: userEmails.isPrimary,
                createdAt: userEmails.createdAt,
                updatedAt: userEmails.updatedAt,
            })
            .from(userEmails)
            .where(eq(userEmails.userId, user.id))
            .orderBy(userEmails.isPrimary, userEmails.createdAt);

        return c.json(emails);
    } catch (error) {
        console.error('Error fetching user emails:', error);
        return c.json({ error: 'Failed to fetch user emails' }, 500);
    }
}

/**
 * Handle POST request to add a new email address
 * @param c - The context object
 * @returns The response object
 */
export async function handleAddUserEmail(c: Context) {
    try {
        const user = getUser(c);
        const body = await c.req.json();

        if (!body.email) {
            return c.json({ error: 'Email address is required' }, 400);
        }

        // Check if email already exists globally
        const existingEmail = await db
            .select()
            .from(userEmails)
            .where(eq(userEmails.email, body.email))
            .limit(1);

        if (existingEmail.length > 0) {
            return c.json({ error: 'Email address already exists' }, 400);
        }

        // If this is the first email or explicitly set as primary, make it primary
        const currentEmails = await db
            .select()
            .from(userEmails)
            .where(eq(userEmails.userId, user.id));

        const isPrimary = currentEmails.length === 0 || body.isPrimary === true;

        // If setting as primary, unset other primary emails
        if (isPrimary) {
            await db
                .update(userEmails)
                .set({ isPrimary: false, updatedAt: new Date() })
                .where(eq(userEmails.userId, user.id));
        }

        const newEmail = await db
            .insert(userEmails)
            .values({
                userId: user.id,
                email: body.email,
                isPrimary: isPrimary,
                verifiedAt: body.verifiedAt || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return c.json(newEmail[0], 201);
    } catch (error) {
        console.error('Error adding user email:', error);
        return c.json({ error: 'Failed to add user email' }, 500);
    }
}

/**
 * Handle PATCH request to update a user email
 * @param c - The context object
 * @returns The response object
 */
export async function handleUpdateUserEmail(c: Context) {
    try {
        const user = getUser(c);
        const emailId = c.req.param('id');
        const body = await c.req.json();

        // Check if email exists and belongs to user
        const existingEmail = await db
            .select()
            .from(userEmails)
            .where(and(eq(userEmails.id, parseInt(emailId)), eq(userEmails.userId, user.id)))
            .limit(1);

        if (existingEmail.length === 0) {
            return c.json({ error: 'Email not found' }, 404);
        }

        // If setting as primary, unset other primary emails
        if (body.isPrimary === true) {
            await db
                .update(userEmails)
                .set({ isPrimary: false, updatedAt: new Date() })
                .where(and(eq(userEmails.userId, user.id), ne(userEmails.id, parseInt(emailId))));
        }

        const updatedEmail = await db
            .update(userEmails)
            .set({
                isPrimary: body.isPrimary,
                verifiedAt: body.verifiedAt,
                updatedAt: new Date(),
            })
            .where(and(eq(userEmails.id, parseInt(emailId)), eq(userEmails.userId, user.id)))
            .returning();

        return c.json(updatedEmail[0]);
    } catch (error) {
        console.error('Error updating user email:', error);
        return c.json({ error: 'Failed to update user email' }, 500);
    }
}

/**
 * Handle DELETE request to remove a user email
 * @param c - The context object
 * @returns The response object
 */
export async function handleDeleteUserEmail(c: Context) {
    try {
        const user = getUser(c);
        const emailId = c.req.param('id');

        // Check if email exists and belongs to user
        const existingEmail = await db
            .select()
            .from(userEmails)
            .where(and(eq(userEmails.id, parseInt(emailId)), eq(userEmails.userId, user.id)))
            .limit(1);

        if (existingEmail.length === 0) {
            return c.json({ error: 'Email not found' }, 404);
        }

        // Check if this is the only email - prevent deletion if so
        const userEmailCount = await db
            .select()
            .from(userEmails)
            .where(eq(userEmails.userId, user.id));

        if (userEmailCount.length === 1) {
            return c.json({ error: 'Cannot delete the only email address' }, 400);
        }

        // If deleting primary email, make another email primary
        const emailToDelete = existingEmail[0];
        if (emailToDelete.isPrimary) {
            const otherEmails = await db
                .select()
                .from(userEmails)
                .where(and(eq(userEmails.userId, user.id), ne(userEmails.id, parseInt(emailId))))
                .orderBy(userEmails.createdAt)
                .limit(1);

            if (otherEmails.length > 0) {
                await db
                    .update(userEmails)
                    .set({ isPrimary: true, updatedAt: new Date() })
                    .where(eq(userEmails.id, otherEmails[0].id));
            }
        }

        // Delete the email
        await db
            .delete(userEmails)
            .where(and(eq(userEmails.id, parseInt(emailId)), eq(userEmails.userId, user.id)));

        return c.json({ success: true });
    } catch (error) {
        console.error('Error deleting user email:', error);
        return c.json({ error: 'Failed to delete user email' }, 500);
    }
}

/**
 * Handle POST request to verify an email address
 * @param c - The context object
 * @returns The response object
 */
export async function handleVerifyUserEmail(c: Context) {
    try {
        const user = getUser(c);
        const emailId = c.req.param('id');

        // Check if email exists and belongs to user
        const existingEmail = await db
            .select()
            .from(userEmails)
            .where(and(eq(userEmails.id, parseInt(emailId)), eq(userEmails.userId, user.id)))
            .limit(1);

        if (existingEmail.length === 0) {
            return c.json({ error: 'Email not found' }, 404);
        }

        // Mark as verified
        const verifiedEmail = await db
            .update(userEmails)
            .set({
                verifiedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(and(eq(userEmails.id, parseInt(emailId)), eq(userEmails.userId, user.id)))
            .returning();

        return c.json(verifiedEmail[0]);
    } catch (error) {
        console.error('Error verifying user email:', error);
        return c.json({ error: 'Failed to verify user email' }, 500);
    }
}
