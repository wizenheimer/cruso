import { z } from 'zod';

// Blog Post Schema
export const BlogPostSchema = z.object({
    slug: z.string().min(1, 'Slug is required'),
    title: z.string().min(1, 'Title is required'),
    date: z.string().datetime('Invalid date format'),
    excerpt: z.string().min(1, 'Excerpt is required'),
    author: z.string().min(1, 'Author is required'),
    content: z.string().min(1, 'Content is required'),
    coverImage: z.string().url('Invalid cover image URL').optional(), // Optional cover image for the blog post
});

// Blog Post List Schema (for multiple blog posts)
export const BlogPostListSchema = z.array(BlogPostSchema);

// Blog Post Input Schema (for creating/updating blog posts)
export const BlogPostInputSchema = BlogPostSchema.omit({ slug: true }).extend({
    slug: z
        .string()
        .min(1, 'Slug is required')
        .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});

// Blog Post Update Schema (all fields optional except slug)
export const BlogPostUpdateSchema = BlogPostInputSchema.partial().extend({
    slug: z.string().min(1, 'Slug is required'),
});

// Service Result Schema
export const ServiceResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        success: z.boolean(),
        data: dataSchema.optional(),
        error: z.string().optional(),
    });

// Specific service result schemas
export const GetBlogPostResultSchema = ServiceResultSchema(BlogPostSchema);
export const GetBlogPostsResultSchema = ServiceResultSchema(BlogPostListSchema);
export const CreateBlogPostResultSchema = ServiceResultSchema(BlogPostSchema);
export const UpdateBlogPostResultSchema = ServiceResultSchema(BlogPostSchema);
export const DeleteBlogPostResultSchema = ServiceResultSchema(z.boolean());
