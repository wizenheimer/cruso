import Link from 'next/link';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center items-center gap-4 mt-12">
            {/* Previous Page */}
            {currentPage > 1 && (
                <Link
                    href={`/blog?page=${currentPage - 1}`}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-[var(--font-color)] hover:bg-[var(--background-hover)] transition-colors"
                    aria-label="Previous page"
                >
                    <svg
                        stroke="currentColor"
                        fill="currentColor"
                        strokeWidth="0"
                        viewBox="0 0 256 256"
                        className="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M34.34,133.66l72,72a8,8,0,0,0,11.32-11.32L59.31,136H216a8,8,0,0,0,0-16H59.31L117.66,61.66a8,8,0,0,0-11.32-11.32l-72,72A8,8,0,0,0,34.34,133.66Z"></path>
                    </svg>
                </Link>
            )}

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Link
                        key={page}
                        href={`/blog?page=${page}`}
                        className={`w-8 h-8 flex items-center justify-center rounded-md ${
                            currentPage === page
                                ? 'bg-black text-white'
                                : 'bg-white text-[var(--font-color)] border border-gray-200 hover:bg-[var(--background-hover)]'
                        } transition-colors`}
                    >
                        {page}
                    </Link>
                ))}
            </div>

            {/* Next Page */}
            {currentPage < totalPages && (
                <Link
                    href={`/blog?page=${currentPage + 1}`}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-[var(--font-color)] hover:bg-[var(--background-hover)] transition-colors"
                    aria-label="Next page"
                >
                    <svg
                        stroke="currentColor"
                        fill="currentColor"
                        strokeWidth="0"
                        viewBox="0 0 256 256"
                        className="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path>
                    </svg>
                </Link>
            )}
        </div>
    );
}
