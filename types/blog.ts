import { z } from 'zod';
import {
    BlogPostSchema,
    BlogPostListSchema,
    BlogPostInputSchema,
    BlogPostUpdateSchema,
    ServiceResultSchema,
    GetBlogPostResultSchema,
    GetBlogPostsResultSchema,
    CreateBlogPostResultSchema,
    UpdateBlogPostResultSchema,
    DeleteBlogPostResultSchema,
} from '@/schema/blog';

// Inferred Types from Zod Schemas

/**
 * Blog post content and metadata.
 * Contains blog post information including title, content, author, and publication data.
 * Used for displaying and managing blog posts.
 * @see schema/blog.ts - BlogPostSchema definition
 * @see lib/blog.ts - Used in blog content management
 * @see app/(marketing)/blog/[slug]/page.tsx - Used in blog post pages
 * @see app/(marketing)/blog/page.tsx - Used in blog listing pages
 */
export type BlogPost = z.infer<typeof BlogPostSchema>;

/**
 * List of blog posts for display.
 * Contains multiple blog posts with pagination and metadata.
 * Used for displaying blog post listings and search results.
 * @see schema/blog.ts - BlogPostListSchema definition
 * @see lib/blog.ts - Used in blog listing functions
 * @see app/(marketing)/blog/page.tsx - Used in blog index page
 */
export type BlogPostList = z.infer<typeof BlogPostListSchema>;

/**
 * Input data for creating new blog posts.
 * Contains required and optional fields for blog post creation.
 * Used as request body when creating blog posts via API.
 * @see schema/blog.ts - BlogPostInputSchema definition
 * @see api/routes/blog/index.ts - Used in POST blog endpoint validation
 */
export type BlogPostInput = z.infer<typeof BlogPostInputSchema>;

/**
 * Input data for updating existing blog posts.
 * Contains optional fields that can be modified during blog post updates.
 * Used as request body when updating blog posts via API.
 * @see schema/blog.ts - BlogPostUpdateSchema definition
 * @see api/routes/blog/index.ts - Used in PATCH blog endpoint validation
 */
export type BlogPostUpdate = z.infer<typeof BlogPostUpdateSchema>;

/**
 * Generic service result wrapper for API responses.
 * Provides consistent error handling and success/failure status.
 * Used across all blog service operations for standardized responses.
 * @see schema/blog.ts - ServiceResultSchema definition
 * @see services/blog/index.ts - Used in blog service responses
 */
export type ServiceResult<T> = z.infer<ReturnType<typeof ServiceResultSchema<z.ZodType<T>>>>;

/**
 * Result of a blog post retrieval operation.
 * Contains blog post data or error information.
 * Used when fetching individual blog posts from the API.
 * @see schema/blog.ts - GetBlogPostResultSchema definition
 * @see api/routes/blog/index.ts - Used in GET blog post endpoint
 */
export type GetBlogPostResult = z.infer<typeof GetBlogPostResultSchema>;

/**
 * Result of a blog posts list retrieval operation.
 * Contains list of blog posts or error information.
 * Used when fetching multiple blog posts from the API.
 * @see schema/blog.ts - GetBlogPostsResultSchema definition
 * @see api/routes/blog/index.ts - Used in GET blog posts endpoint
 */
export type GetBlogPostsResult = z.infer<typeof GetBlogPostsResultSchema>;

/**
 * Result of creating a blog post operation.
 * Contains the created blog post data or error information.
 * Used when creating new blog posts via API.
 * @see schema/blog.ts - CreateBlogPostResultSchema definition
 * @see api/routes/blog/index.ts - Used in POST blog endpoint
 */
export type CreateBlogPostResult = z.infer<typeof CreateBlogPostResultSchema>;

/**
 * Result of updating a blog post operation.
 * Contains the updated blog post data or error information.
 * Used when modifying blog posts via API.
 * @see schema/blog.ts - UpdateBlogPostResultSchema definition
 * @see api/routes/blog/index.ts - Used in PATCH blog endpoint
 */
export type UpdateBlogPostResult = z.infer<typeof UpdateBlogPostResultSchema>;

/**
 * Result of deleting a blog post operation.
 * Contains success confirmation or error information.
 * Used when removing blog posts via API.
 * @see schema/blog.ts - DeleteBlogPostResultSchema definition
 * @see api/routes/blog/index.ts - Used in DELETE blog endpoint
 */
export type DeleteBlogPostResult = z.infer<typeof DeleteBlogPostResultSchema>;
