import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { auth, optionalAuth } from '../middleware/auth';

const users = new Hono();

// Validation schemas
const createUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email format'),
    age: z.number().min(0).optional(),
});

const updateUserSchema = createUserSchema.partial();

// GET /api/v1/users - Public endpoint with optional auth
users.get('/', optionalAuth, (c) => {
    const user = c.get('user'); // Will be undefined if not authenticated

    return c.json({
        users: [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        ],
        total: 2,
        authenticated: !!user,
    });
});

// GET /api/v1/users/:id
users.get('/:id', (c) => {
    const id = c.req.param('id');

    // Simulate user lookup
    const user = { id: parseInt(id), name: 'John Doe', email: 'john@example.com' };

    if (!user) {
        return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
});

// POST /api/v1/users - Requires authentication
users.post('/', auth, zValidator('json', createUserSchema), async (c) => {
    const body = await c.req.valid('json');
    const authenticatedUser = c.get('user');

    if (!authenticatedUser) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    // Simulate user creation
    const newUser = {
        id: Math.floor(Math.random() * 1000),
        ...body,
        createdAt: new Date().toISOString(),
        createdBy: authenticatedUser.id,
    };

    return c.json(
        {
            message: 'User created successfully',
            user: newUser,
        },
        201,
    );
});

// PUT /api/v1/users/:id
users.put('/:id', zValidator('json', updateUserSchema), async (c) => {
    const id = c.req.param('id');
    const body = await c.req.valid('json');

    // Simulate user update
    const updatedUser = {
        id: parseInt(id),
        ...body,
        updatedAt: new Date().toISOString(),
    };

    return c.json({
        message: 'User updated successfully',
        user: updatedUser,
    });
});

// DELETE /api/v1/users/:id
users.delete('/:id', (c) => {
    const id = c.req.param('id');

    // Simulate user deletion
    return c.json({
        message: `User ${id} deleted successfully`,
    });
});

export default users;
