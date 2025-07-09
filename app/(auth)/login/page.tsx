'use client';

import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Testimonials } from '@/components/onboarding/Testimonials';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

// Replace with actual testimonials from users
const testimonials = [
    {
        id: 1,
        quote: 'Few things make me feel more powerful than setting up automations in Cruso to make my life easier and more efficient.',
        author: 'Aliah Lane',
        title: 'Founder, Layers.io',
        rating: 5,
    },
    {
        id: 2,
        quote: 'Cruso has completely transformed how I manage my daily workflows. The automation possibilities are endless.',
        author: 'Marcus Chen',
        title: 'Product Manager, TechFlow',
        rating: 5,
    },
    {
        id: 3,
        quote: 'The intuitive interface and powerful automation features make Cruso indispensable for my productivity stack.',
        author: 'Sarah Williams',
        title: 'CEO, InnovateLab',
        rating: 5,
    },
];

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const signUpWithGoogle = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await authClient.signIn.social({
                provider: 'google',
                callbackURL: '/dashboard',
            });

            // Check for error in response
            if (response?.error) {
                throw new Error(response.error.message || 'Authentication failed');
            }

            // Check for URL in data property
            if (response?.data?.url) {
                window.location.href = response.data.url;
                return;
            }

            // If no URL is returned, something went wrong
            setError('Failed to get Google OAuth URL. Please try again.');
            setLoading(false);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Failed to sign up with Google. Please try again.',
            );
            setLoading(false);
        }
    };

    // Add keyboard shortcut for Cmd+Enter
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !loading) {
                event.preventDefault();
                signUpWithGoogle();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [loading]);

    return (
        <div className="flex min-h-screen">
            {/* Left side - Nav and centered card */}
            <div className="flex flex-1 flex-col bg-white relative">
                {/* Nav */}
                <nav className="absolute top-0 left-0 w-full flex items-center h-20 px-8">
                    <Link href="/" className="text-xl font-semibold">
                        Cruso
                    </Link>
                </nav>
                {/* Centered onboarding card */}
                <motion.div
                    className="flex flex-1 flex-col items-center justify-center min-h-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                    <motion.div
                        className="w-full max-w-xs flex flex-col items-center"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                    >
                        <h1 className="text-2xl font-semibold mb-2 text-center">
                            We&apos;re almost there
                        </h1>
                        <p className="text-base text-muted-foreground mb-6 text-center">
                            Quick auth and we make this official
                        </p>
                        <Button
                            onClick={signUpWithGoogle}
                            disabled={loading}
                            className="w-full h-10 text-base font-normal justify-center mt-2"
                            variant="outline"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Connecting...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Login with Google
                                </div>
                            )}
                        </Button>

                        {/* Keyboard shortcut guide */}
                        <div className="mt-4 text-center">
                            <div className="flex justify-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-gray-100 rounded">⌘</kbd>
                                    <span>+</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded">↵</kbd>
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Sign up link - Footer */}
                    <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 text-center px-4">
                        <p className="text-sm text-muted-foreground">
                            New user?{' '}
                            <Link
                                href="/signup"
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right side - Testimonial and Image */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden flex-col justify-start rounded-l-2xl">
                <motion.div
                    className="px-8 xl:px-16 pt-8 xl:pt-16 pb-4 w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                >
                    {/* Testimonials Section - Add testimonials */}
                    <Testimonials
                        testimonials={testimonials}
                        autoPlay={true}
                        interval={5000}
                        showNavigation={true}
                        className="w-full"
                    />
                </motion.div>

                {/* Image Section - clean sneak peek effect */}
                <div className="absolute bottom-0 right-0 w-full h-full flex items-end justify-end">
                    <motion.div
                        className="relative w-[75%] h-[60%] transform translate-x-[8%] translate-y-[8%]"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                    >
                        <Image
                            src="/images/assets/onboarding/preview.png"
                            alt="Cruso Preview"
                            fill
                            className="object-cover rounded-xl shadow-2xl object-left-top"
                            priority
                            sizes="(max-width: 1024px) 50vw, 40vw"
                        />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
