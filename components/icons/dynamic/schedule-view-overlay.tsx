'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function ScheduleViewOverlay() {
    return (
        <div className="relative w-full h-auto">
            <div className="flex items-center justify-center gap-4 w-full">
                {/* First Person View */}
                <motion.div
                    className="flex-1 max-w-[180px]"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <Image
                        src="/images/assets/onboarding/first-person-view.svg"
                        alt="First Person View"
                        width={180}
                        height={200}
                        className="w-full h-auto block"
                    />
                    <div className="text-center mt-2 text-xs text-gray-600 font-medium">
                        Your View
                    </div>
                </motion.div>

                {/* Arrow */}
                <motion.div
                    className="flex flex-col items-center justify-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-400"
                    >
                        <path
                            d="M5 12H19M19 12L12 5M19 12L12 19"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </motion.div>

                {/* Third Person View */}
                <motion.div
                    className="flex-1 max-w-[180px]"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <Image
                        src="/images/assets/onboarding/third-person-view.svg"
                        alt="Third Person View"
                        width={180}
                        height={200}
                        className="w-full h-auto block"
                    />
                    <div className="text-center mt-2 text-xs text-gray-600 font-medium">
                        Their View
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
