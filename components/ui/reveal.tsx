'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface RevealProps {
    children: ReactNode;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    duration?: number;
    className?: string;
}

export default function Reveal({
    children,
    delay = 0,
    direction = 'up',
    duration = 0.5,
    className = '',
}: RevealProps) {
    const directions = {
        up: { y: 40, opacity: 0 },
        down: { y: -40, opacity: 0 },
        left: { x: 40, opacity: 0 },
        right: { x: -40, opacity: 0 },
    };

    return (
        <motion.div
            initial={directions[direction]}
            whileInView={{
                y: 0,
                x: 0,
                opacity: 1,
            }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
