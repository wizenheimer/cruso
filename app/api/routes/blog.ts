import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const blog = new Hono();

// Validation schemas
const createPostSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    slug: z.string().min(1, 'Slug is required'),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

const updatePostSchema = createPostSchema.partial();

// GET /api/v1/blog/posts
blog.get('/posts', (c) => {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');

    return c.json({
        posts: [
            {
                id: 1,
                title: 'Getting Started with Hono',
                slug: 'getting-started-with-hono',
                excerpt: 'Learn how to build fast APIs with Hono...',
                publishedAt: '2024-01-15T10:00:00Z',
            },
            {
                id: 2,
                title: 'Next.js App Router Best Practices',
                slug: 'nextjs-app-router-best-practices',
                excerpt: 'Discover the best practices for...',
                publishedAt: '2024-01-10T14:30:00Z',
            },
        ],
        pagination: {
            page,
            limit,
            total: 2,
            totalPages: 1,
        },
    });
});

// GET /api/v1/blog/posts/:slug
blog.get('/posts/:slug', (c) => {
    const slug = c.req.param('slug');

    // Simulate post lookup
    const post = {
        id: 1,
        title: 'Getting Started with Hono',
        slug,
        content: 'This is the full content of the blog post...',
        excerpt: 'Learn how to build fast APIs with Hono...',
        tags: ['hono', 'api', 'typescript'],
        publishedAt: '2024-01-15T10:00:00Z',
        author: {
            name: 'John Doe',
            email: 'john@example.com',
        },
    };

    if (!post) {
        return c.json(
            {
                error: 'Post not found',
                timestamp: new Date().toISOString(),
                route: c.req.path,
            },
            404,
        );
    }

    return c.json({ post });
});

// POST /api/v1/blog/posts
blog.post('/posts', zValidator('json', createPostSchema), async (c) => {
    const body = await c.req.valid('json');

    // Simulate post creation
    const newPost = {
        id: Math.floor(Math.random() * 1000),
        ...body,
        publishedAt: new Date().toISOString(),
        author: {
            name: 'Current User',
            email: 'user@example.com',
        },
    };

    return c.json(
        {
            message: 'Post created successfully',
            post: newPost,
        },
        201,
    );
});

// PUT /api/v1/blog/posts/:slug
blog.put('/posts/:slug', zValidator('json', updatePostSchema), async (c) => {
    const slug = c.req.param('slug');
    const body = await c.req.valid('json');

    // Simulate post update
    const updatedPost = {
        id: 1,
        slug,
        ...body,
        updatedAt: new Date().toISOString(),
    };

    return c.json({
        message: 'Post updated successfully',
        post: updatedPost,
    });
});

// DELETE /api/v1/blog/posts/:slug
blog.delete('/posts/:slug', (c) => {
    const slug = c.req.param('slug');

    return c.json({
        message: `Post "${slug}" deleted successfully`,
    });
});

// GET /api/v1/blog/tags
blog.get('/tags', (c) => {
    return c.json({
        tags: [
            { name: 'hono', count: 5 },
            { name: 'nextjs', count: 3 },
            { name: 'typescript', count: 8 },
            { name: 'api', count: 2 },
        ],
    });
});

export default blog;
