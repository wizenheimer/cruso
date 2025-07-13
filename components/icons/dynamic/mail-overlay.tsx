'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

function useCyclingTypewriter(
    texts: string[],
    typeSpeed: number = 60,
    deleteSpeed: number = 30,
    pauseDuration: number = 1000,
) {
    const [displayed, setDisplayed] = useState('');
    const [currentTextIndex, setCurrentTextIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(true);

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
                timeout = setTimeout(() => {
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

    return { displayed, isTyping };
}

type MailboxOverlayProps = {
    emailAddresses: string[];
    typeSpeed?: number;
    deleteSpeed?: number;
    pauseDuration?: number;
};

export default function MailboxOverlay({
    emailAddresses,
    typeSpeed,
    deleteSpeed,
    pauseDuration,
}: MailboxOverlayProps) {
    const defaultTypeSpeed = 80;
    const defaultDeleteSpeed = 40;
    const defaultPauseDuration = 1500;

    // Trim long email addresses to max 18 characters
    const trimmedEmails = emailAddresses.map((email) => {
        if (email.length <= 18) return email;

        const atIndex = email.indexOf('@');
        if (atIndex === -1) {
            // No @ symbol, just truncate
            return email.substring(0, 15) + '...';
        }

        const localPart = email.substring(0, atIndex);
        const domainPart = email.substring(atIndex);

        // Calculate how much we can keep from local part
        const maxLocalLength = 18 - domainPart.length - 3; // 3 for "..."

        if (maxLocalLength <= 0) {
            // Domain is too long, truncate domain
            return localPart + '@' + domainPart.substring(1, 14) + '...';
        }

        if (localPart.length > maxLocalLength) {
            return localPart.substring(0, maxLocalLength) + '...' + domainPart;
        }

        return email;
    });

    const { displayed, isTyping } = useCyclingTypewriter(
        trimmedEmails,
        typeSpeed ?? defaultTypeSpeed,
        deleteSpeed ?? defaultDeleteSpeed,
        pauseDuration ?? defaultPauseDuration,
    );

    return (
        <div className="relative w-full h-auto">
            <Image
                src="/images/assets/onboarding/mailbox.svg"
                alt="Mailbox"
                width={400}
                height={300}
                className="w-full h-auto block"
            />

            {/* Text overlay positioned at the top */}
            <motion.div
                className="absolute top-[5%] left-[36%] right-[7%] text-center text-sm md:text-base lg:text-lg font-medium text-gray-700 pointer-events-none select-none min-h-[1.2em]"
                style={{
                    fontFamily: 'sans-serif',
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
