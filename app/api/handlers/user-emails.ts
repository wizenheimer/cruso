import { Context } from 'hono';
import { userEmailService } from '@/services/user-emails';

/**
 * Extract the authenticated user from the request context
 * @param requestContext - The Hono context object containing request data
 * @returns The authenticated user object
 * @throws Error if user is not found in context
 */
export const getUser = (requestContext: Context) => {
    const authenticatedUser = requestContext.get('user');
    if (!authenticatedUser) {
        throw new Error('User not found in context');
    }
    return authenticatedUser;
};

/**
 * Handle GET request to fetch user emails
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with user emails or error message
 */
export async function handleGetUserEmails(requestContext: Context) {
    try {
        const authenticatedUser = getUser(requestContext);
        const userEmailsResult = await userEmailService.getUserEmails(authenticatedUser.id);

        if (!userEmailsResult.success) {
            return requestContext.json({ error: userEmailsResult.error }, 500);
        }

        return requestContext.json(userEmailsResult.data);
    } catch (fetchUserEmailsError) {
        console.error('Error fetching user emails:', fetchUserEmailsError);
        return requestContext.json({ error: 'Failed to fetch user emails' }, 500);
    }
}

/**
 * Handle POST request to add a new email address
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with created email or error message
 */
export async function handleAddUserEmail(requestContext: Context) {
    try {
        const authenticatedUser = getUser(requestContext);
        const addEmailPayload = await requestContext.req.json();

        const addUserEmailResult = await userEmailService.addUserEmail(authenticatedUser.id, {
            email: addEmailPayload.email,
            isPrimary: addEmailPayload.isPrimary,
        });

        if (!addUserEmailResult.success) {
            return requestContext.json({ error: addUserEmailResult.error }, 400);
        }

        return requestContext.json(addUserEmailResult.data, 201);
    } catch (addUserEmailError) {
        console.error('Error adding user email:', addUserEmailError);
        return requestContext.json({ error: 'Failed to add user email' }, 500);
    }
}

/**
 * Handle PATCH request to update a user email
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response with updated email or error message
 */
export async function handleUpdateUserEmail(requestContext: Context) {
    try {
        const authenticatedUser = getUser(requestContext);
        const targetEmailId = requestContext.req.param('id');
        const updateEmailPayload = await requestContext.req.json();

        const updateUserEmailResult = await userEmailService.updateUserEmail(
            authenticatedUser.id,
            parseInt(targetEmailId),
            {
                isPrimary: updateEmailPayload.isPrimary,
            },
        );

        if (!updateUserEmailResult.success) {
            const statusCode = updateUserEmailResult.error === 'Email not found' ? 404 : 500;
            return requestContext.json({ error: updateUserEmailResult.error }, statusCode);
        }

        return requestContext.json(updateUserEmailResult.data);
    } catch (updateUserEmailError) {
        console.error('Error updating user email:', updateUserEmailError);
        return requestContext.json({ error: 'Failed to update user email' }, 500);
    }
}

/**
 * Handle DELETE request to remove a user email
 * @param requestContext - The Hono context object containing request data
 * @returns JSON response confirming deletion or error message
 */
export async function handleDeleteUserEmail(requestContext: Context) {
    try {
        const authenticatedUser = getUser(requestContext);
        const targetEmailId = requestContext.req.param('id');

        const deleteUserEmailResult = await userEmailService.deleteUserEmail(
            authenticatedUser.id,
            parseInt(targetEmailId),
        );

        if (!deleteUserEmailResult.success) {
            const statusCode = deleteUserEmailResult.error === 'Email not found' ? 404 : 400;
            return requestContext.json({ error: deleteUserEmailResult.error }, statusCode);
        }

        return requestContext.json({ success: true });
    } catch (deleteUserEmailError) {
        console.error('Error deleting user email:', deleteUserEmailError);
        return requestContext.json({ error: 'Failed to delete user email' }, 500);
    }
}
