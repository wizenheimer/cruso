import { Context } from 'hono';
import { userEmailService } from '@/services/user-emails';

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
        const result = await userEmailService.getUserEmails(user.id);

        if (!result.success) {
            return c.json({ error: result.error }, 500);
        }

        return c.json(result.data);
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

        const result = await userEmailService.addUserEmail(user.id, {
            email: body.email,
            isPrimary: body.isPrimary,
        });

        if (!result.success) {
            return c.json({ error: result.error }, 400);
        }

        return c.json(result.data, 201);
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

        const result = await userEmailService.updateUserEmail(user.id, parseInt(emailId), {
            isPrimary: body.isPrimary,
        });

        if (!result.success) {
            const statusCode = result.error === 'Email not found' ? 404 : 500;
            return c.json({ error: result.error }, statusCode);
        }

        return c.json(result.data);
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

        const result = await userEmailService.deleteUserEmail(user.id, parseInt(emailId));

        if (!result.success) {
            const statusCode = result.error === 'Email not found' ? 404 : 400;
            return c.json({ error: result.error }, statusCode);
        }

        return c.json({ success: true });
    } catch (error) {
        console.error('Error deleting user email:', error);
        return c.json({ error: 'Failed to delete user email' }, 500);
    }
}
