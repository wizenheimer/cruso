import { Metadata } from 'next';
import { getAllPosts } from '@/lib/blog';
import Navigation from '@/app/components/Navigation';
import BlogCard from '@/app/components/blog/BlogCard';
import BlogHeader from '@/app/components/blog/BlogHeader';
import Pagination from '@/app/components/blog/Pagination';
import Footer from '@/app/components/Footer';

interface BlogPageProps {
    searchParams: Promise<{ page?: string }>;
}

export const metadata: Metadata = {
    title: 'Blog | Cruso',
    description: 'Your frontrow seat to everything Cruso',
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
    const { page } = await searchParams;
    const currentPage = Number(page) || 1;
    const { posts, totalPages } = await getAllPosts(currentPage);

    return (
        <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="flex-1">
                <section className="py-16 md:py-24 px-6 md:px-12 scroll-mt-20">
                    <div className="max-w-7xl mx-auto">
                        <BlogHeader />

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {posts.map((post) => (
                                <BlogCard key={post.slug} post={post} />
                            ))}
                        </div>

                        <Pagination currentPage={currentPage} totalPages={totalPages} />
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
