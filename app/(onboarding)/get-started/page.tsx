'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const currentStep = 1;
const totalSteps = 3;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(currentStep);

    // Handle next step for the onboarding flow
    const handleNext = async () => {
        setLoading(true);

        try {
            // TODO: Implement next step
            if (currentStep <= totalSteps) {
                setStep(currentStep + 1);
            }
            setLoading(false);
        } catch (error) {
            console.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to sign up with Google. Please try again.',
            );
            setLoading(false);
        }
    };

    // Handle step navigation
    const handleStepClick = (stepNumber: number) => {
        setStep(stepNumber);
    };

    // Add keyboard shortcut for Cmd+Enter
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !loading) {
                event.preventDefault();
                handleNext();
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
                <nav className="absolute top-0 left-0 w-full flex items-center justify-between h-20 px-8">
                    <Link href="/" className="text-xl font-semibold">
                        Cruso
                    </Link>
                    <div className="relative group">
                        <button
                            onClick={handleNext}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-md"
                        >
                            Next
                        </button>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <div className="text-xs text-gray-500 whitespace-nowrap">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-gray-100 rounded">⌘</kbd>
                                    <span>+</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded">↵</kbd>
                                </span>
                            </div>
                        </div>
                    </div>
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
                            Lorem Ipsum Dolor
                        </h1>
                        <p className="text-base text-muted-foreground mb-6 text-center">
                            Sit amet consectetur adipisicing elit
                        </p>
                        {/* TODO: Add left side content here */}
                    </motion.div>

                    {/* Step indicators - Footer */}
                    <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 text-center px-4">
                        <div className="flex items-center justify-center gap-3">
                            {Array.from({ length: totalSteps }, (_, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleStepClick(index + 1)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 hover:scale-110 ${
                                        index + 1 === step ? 'bg-black scale-110' : 'bg-gray-300'
                                    }`}
                                    aria-label={`Go to step ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Right side - Testimonial and Image */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden flex-col justify-start rounded-l-2xl">
                {/* Add right side content */}
            </div>
        </div>
    );
};

export default LoginPage;
