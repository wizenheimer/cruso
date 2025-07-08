'use client';

import { useState, useEffect } from 'react';
import VideoTabs from './VideoTabs';
import AnimatedUnderline from './AnimatedUnderline';
import FadeIn from './ui/fade-in';
import Cursor from './ui/cursor';

export default function Hero() {
    const [text, setText] = useState('Email');
    const [isFocused, setIsFocused] = useState(true);
    const [keyOverlay, setKeyOverlay] = useState<{ key: string; visible: boolean }>({
        key: '',
        visible: false,
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isFocused) return;

            let displayKey = '';
            let shouldUpdateText = false;

            if (e.key === 'Backspace') {
                e.preventDefault();
                setText((prev) => prev.slice(0, -1));
                displayKey = 'Back';
            } else if (e.key === ' ') {
                e.preventDefault();
                setText('Email');
                displayKey = 'Space';
                shouldUpdateText = true;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                displayKey = 'Enter';
            } else if (e.key === 'Tab') {
                e.preventDefault();
                displayKey = 'Tab';
            } else if (e.key === 'Escape') {
                e.preventDefault();
                displayKey = 'Esc';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                displayKey = 'Up';
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                displayKey = 'Down';
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                displayKey = 'Left';
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                displayKey = 'Right';
            } else if (e.key.length === 1) {
                e.preventDefault();
                setText('Email');
                displayKey = e.key.toUpperCase();
                shouldUpdateText = true;
            }

            // Only show overlay if we have a display key
            if (displayKey) {
                setKeyOverlay({ key: displayKey, visible: true });

                // Hide overlay after a short delay
                setTimeout(() => {
                    setKeyOverlay((prev) => ({ ...prev, visible: false }));
                }, 300);
            }
        };

        const handleClick = () => {
            setIsFocused(true);
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('click', handleClick);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('click', handleClick);
        };
    }, [isFocused]);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-6 md:px-12 py-32 md:py-40 space-y-8 md:space-y-12 relative">
            {/* Key Overlay */}
            {keyOverlay.visible && (
                <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
                    <div
                        className={`
                        bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-3 shadow-2xl
                        transform transition-all duration-300 ease-out
                        ${keyOverlay.visible ? 'scale-100 opacity-100 translate-y-0' : 'scale-75 opacity-0 translate-y-4'}
                    `}
                    >
                        <div className="text-center">
                            <div className="text-lg font-mono font-semibold text-white mb-0.5">
                                {keyOverlay.key}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-center max-w-5xl mx-auto">
                <FadeIn delay={0.2}>
                    <h2
                        className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 font-lora cursor-text select-none"
                        onClick={() => setIsFocused(true)}
                    >
                        <span className="block">
                            AI Assistant You Can {text}
                            <Cursor className="ml-1" color="#c7d2fe" />
                        </span>
                    </h2>
                </FadeIn>
                <FadeIn delay={0.4}>
                    <p className="text-lg md:text-xl lg:text-2xl mb-8 mt-6 max-w-4xl mx-auto text-gray-600 font-lora">
                        No apps. No logins. Just email
                    </p>
                </FadeIn>
            </div>

            {/* Tabbed Dashboard Preview */}
            <VideoTabs />
        </main>
    );
}
