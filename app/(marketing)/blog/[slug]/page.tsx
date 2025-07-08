import { Metadata } from 'next';
import { getPostBySlug } from '@/lib/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

interface BlogPostPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        return {
            title: 'Post Not Found',
            description: 'The requested blog post could not be found.',
        };
    }

    const title = `${post.title} | Cruso Blog`;
    const description = post.excerpt;
    const image = post.coverImage || '/og-image.png';

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            publishedTime: post.date,
            authors: [post.author],
            siteName: 'Cruso',
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="w-full min-h-screen bg-white flex flex-col">
            <Navigation />
            <main className="flex-grow">
                <article className="container mx-auto px-4 py-16 max-w-4xl">
                    <div className="flex justify-between items-center mb-8">
                        <Link
                            href="/blog"
                            className="inline-flex items-center text-gray-600 hover:text-primary"
                        >
                            <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            Back to Blog
                        </Link>
                    </div>
                    <header className="mb-12">
                        <h1 className="text-5xl font-bold mb-6">{post.title}</h1>
                        <div className="flex items-center text-gray-600">
                            <time className="mr-6">
                                {new Date(post.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </time>
                            <span>Posted by {post.author}</span>
                        </div>
                    </header>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <MDXRemote source={post.content} />
                    </div>
                </article>
            </main>
            <Footer />
        </div>
    );
}
