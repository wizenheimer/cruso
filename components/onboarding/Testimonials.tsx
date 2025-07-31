'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
    quote: string;
}

interface TestimonialsProps {
    testimonials: Testimonial[];
    autoPlay?: boolean;
    interval?: number;
    showNavigation?: boolean;
    className?: string;
}

export const Testimonials = ({
    autoPlay = true,
    interval = 5000,
    showNavigation = true,
    className = '',
    testimonials,
}: TestimonialsProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!autoPlay || isHovered) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, interval);

        return () => clearInterval(timer);
    }, [autoPlay, interval, isHovered, testimonials.length]);

    const goToNext = () => {
        console.log('Next clicked, current:', currentIndex);
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const goToPrevious = () => {
        console.log('Previous clicked, current:', currentIndex);
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const goToSlide = (index: number) => {
        console.log('Dot clicked, going to:', index);
        setCurrentIndex(index);
    };

    const currentTestimonial = testimonials[currentIndex];

    return (
        <div
            className={`flex flex-col items-start w-full z-20 relative ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Main testimonial content */}
            <div className="relative w-full">
                <div className="text-xs lg:text-sm xl:text-base font-semibold mb-4 text-gray-800 max-w-xl text-left leading-relaxed transition-opacity duration-300">
                    {currentTestimonial.quote}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between w-full max-w-xl mt-2">
                {/* Dots indicator */}
                <div className="flex gap-2">
                    {testimonials.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer z-30 relative ${
                                index === currentIndex
                                    ? 'bg-gray-600 w-6'
                                    : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                            aria-label={`Go to testimonial ${index + 1}`}
                            type="button"
                        />
                    ))}
                </div>

                {/* Navigation arrows */}
                {showNavigation && (
                    <div className="flex gap-2">
                        <button
                            onClick={goToPrevious}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 cursor-pointer z-30 relative"
                            aria-label="Previous testimonial"
                            type="button"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 cursor-pointer z-30 relative"
                            aria-label="Next testimonial"
                            type="button"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
