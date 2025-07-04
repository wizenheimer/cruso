import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';

const POSTS_PER_PAGE = 6;

export interface BlogPost {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    author: string;
    content: string;
    coverImage?: string; // Optional cover image for the blog post
}

export async function getAllPosts(
    page: number = 1,
): Promise<{ posts: BlogPost[]; totalPages: number }> {
    const postsDirectory = path.join(process.cwd(), 'content/blog');

    // Check if directory exists before reading
    if (!fs.existsSync(postsDirectory)) {
        return { posts: [], totalPages: 0 };
    }

    let filenames: string[];
    try {
        filenames = fs.readdirSync(postsDirectory);
    } catch (error) {
        console.error(`Error reading blog posts directory: ${error}`);
        return { posts: [], totalPages: 0 };
    }

    const posts = filenames
        .filter((filename) => filename.endsWith('.mdx'))
        .map((filename) => {
            const filePath = path.join(postsDirectory, filename);
            const fileContents = fs.readFileSync(filePath, 'utf8');
            const { data, content } = matter(fileContents);
            const slug = filename.replace(/\.mdx$/, '');

            return {
                slug,
                title: data.title,
                date: data.date,
                excerpt: data.excerpt,
                author: data.author || 'Admin',
                content,
            };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
    const startIndex = (page - 1) * POSTS_PER_PAGE;
    const paginatedPosts = posts.slice(startIndex, startIndex + POSTS_PER_PAGE);

    return { posts: paginatedPosts, totalPages };
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    const postsDirectory = path.join(process.cwd(), 'content/blog');
    const filePath = path.join(postsDirectory, `${slug}.mdx`);

    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContents);

        return {
            slug,
            title: data.title,
            date: data.date,
            excerpt: data.excerpt,
            author: data.author || 'Admin',
            content,
        };
    } catch {
        return null;
    }
}

export async function getPostContent(post: BlogPost) {
    const mdxSource = await serialize(post.content);
    return mdxSource;
}
