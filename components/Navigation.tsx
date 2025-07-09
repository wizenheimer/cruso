'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Signup route
 */
const signupRoute = '/signup';

/**
 * Navigation component
 * @returns The navigation component
 */
export default function Navigation() {
    const router = useRouter();

    // Handle Cmd/Ctrl + Enter shortcut for Get Started
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                router.push(signupRoute);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [router]);

    return (
        <header className="sticky top-0 z-50 w-full py-4 px-6 md:px-12 flex justify-between items-center backdrop-blur-md">
            <Link href="/" className="font-bold text-xl hover:opacity-80 transition-opacity">
                Cruso
            </Link>
            <nav className="hidden md:flex space-x-8"></nav>
            <button
                onClick={() => router.push(signupRoute)}
                className="bg-black text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
                <span>Get Started</span>
                <span className="text-xs opacity-60">⌘↵</span>
            </button>
        </header>
    );
}
