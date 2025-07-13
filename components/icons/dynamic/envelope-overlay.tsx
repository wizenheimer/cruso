'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function useCyclingTypewriter(
    texts: string[],
    typeSpeed: number = 60,
    deleteSpeed: number = 30,
    pauseDuration: number = 1000,
) {
    const [displayed, setDisplayed] = useState('');
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(true);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (!texts.length) return;

        const currentText = texts[currentTextIndex];
        let timeout: NodeJS.Timeout;

        if (isTyping) {
            // Typing phase
            if (displayed.length < currentText.length) {
                timeout = setTimeout(() => {
                    setDisplayed(currentText.substring(0, displayed.length + 1));
                }, typeSpeed);
            } else {
                // Finished typing, pause then start deleting
                setIsComplete(true);
                timeout = setTimeout(() => {
                    setIsComplete(false);
                    setIsTyping(false);
                }, pauseDuration);
            }
        } else {
            // Deleting phase
            if (displayed.length > 0) {
                timeout = setTimeout(() => {
                    setDisplayed(displayed.substring(0, displayed.length - 1));
                }, deleteSpeed);
            } else {
                // Finished deleting, move to next text
                timeout = setTimeout(() => {
                    setCurrentTextIndex((prev) => (prev + 1) % texts.length);
                    setIsTyping(true);
                }, 300); // Brief pause before starting next text
            }
        }

        return () => clearTimeout(timeout);
    }, [displayed, currentTextIndex, isTyping, texts, typeSpeed, deleteSpeed, pauseDuration]);

    return { displayed, isComplete, currentTextIndex, isTyping };
}

type EnvelopeOverlayProps = {
    name?: string;
    typeSpeed?: number;
    deleteSpeed?: number;
    pauseDuration?: number;
};

export default function EnvelopeOverlay({
    name,
    typeSpeed,
    deleteSpeed,
    pauseDuration,
}: EnvelopeOverlayProps) {
    // Trim long names to max 10 characters
    const trimmedName = name && name.length > 10 ? name.substring(0, 7) + '...' : name;

    // Define the texts to cycle through
    const texts = [`Hi ${trimmedName}`, `Hey ${trimmedName}`, `Hello ${trimmedName}`];

    const defaultTypeSpeed = 80;
    const defaultDeleteSpeed = 40;
    const defaultPauseDuration = 1500;

    const { displayed, isTyping } = useCyclingTypewriter(
        texts,
        typeSpeed ?? defaultTypeSpeed,
        deleteSpeed ?? defaultDeleteSpeed,
        pauseDuration ?? defaultPauseDuration,
    );

    return (
        <div style={{ position: 'relative', width: 380, height: 400 }}>
            <img
                src="/images/assets/onboarding/envelope.svg"
                alt="Envelope"
                style={{ width: '100%', height: '100%', display: 'block' }}
            />
            <motion.div
                style={{
                    position: 'absolute',
                    top: 75,
                    left: 60,
                    width: 180,
                    textAlign: 'left',
                    fontSize: 20,
                    fontFamily: 'sans-serif',
                    color: '#444',
                    fontWeight: 500,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    minHeight: '1.2em', // Prevents layout shift when text is empty
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {displayed}
                {/* Animated cursor */}
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        // Cursor blinks faster when deleting
                        ...(isTyping ? {} : { duration: 0.5 }),
                    }}
                    style={{
                        marginLeft: 2,
                        color: isTyping ? '#444' : '#666', // Slightly different color when deleting
                    }}
                >
                    |
                </motion.span>
            </motion.div>

            {/* Optional: Show current text info for debugging */}
            {/* <div style={{ position: "absolute", bottom: 10, left: 10, fontSize: 12, color: "#999" }}>
        Text {currentTextIndex + 1}/{texts.length} - {isTyping ? "Typing" : "Deleting"}
      </div> */}
        </div>
    );
}
