// Blog types
export interface BlogPost {
    slug: string;
    title: string;
    date: string;
    excerpt: string;
    author: string;
    content: string;
    coverImage?: string; // Optional cover image for the blog post
}
