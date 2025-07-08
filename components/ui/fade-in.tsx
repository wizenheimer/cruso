'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInProps {
    children: ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
}

export default function FadeIn({
    children,
    delay = 0,
    duration = 0.6,
    className = '',
}: FadeInProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-50px' }}
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
