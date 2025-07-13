'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Mock data representing meeting density for each day
// 0 = no meetings, 1-3 = low density, 4-6 = medium density, 7+ = high density
const mockHeatmapData = [
    // 6AM, 7AM, 8AM, 9AM, 10AM, 11AM, 12PM, 1PM, 2PM, 3PM, 4PM
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // SUN
    [7, 7, 7, 7, 11, 3, 1, 0, 0, 0, 0], // MON
    [6, 6, 6, 13, 4, 4, 0, 0, 1, 0, 0], // TUE
    [7, 7, 7, 7, 11, 2, 0, 0, 0, 0, 0], // WED
    [7, 8, 8, 8, 11, 3, 2, 1, 1, 1, 1], // THU
    [7, 7, 7, 8, 10, 3, 1, 1, 1, 1, 1], // FRI
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0], // SAT
];

const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const timeSlots = ['6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM'];

const getColorIntensity = (value: number): string => {
    if (value === 0) return 'bg-gray-100';
    if (value <= 3) return 'bg-blue-100';
    if (value <= 6) return 'bg-blue-200';
    if (value <= 9) return 'bg-blue-300';
    if (value <= 12) return 'bg-blue-400';
    return 'bg-blue-500';
};

export default function ScheduleHeatmapOverlay() {
    return (
        <div className="relative w-full h-auto">
            <motion.div
                className="w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Heatmap Grid */}
                <div className="space-y-0.5">
                    {/* Time slot headers */}
                    <div className="grid grid-cols-12 gap-0.5 mb-2">
                        <div className="text-xs text-gray-500 font-medium text-center py-1"></div>
                        {timeSlots.map((time) => (
                            <div
                                key={time}
                                className="text-xs text-gray-500 font-medium text-center py-1"
                            >
                                {time}
                            </div>
                        ))}
                    </div>

                    {/* Days and data */}
                    {days.map((day, dayIndex) => (
                        <motion.div
                            key={day}
                            className="grid grid-cols-12 gap-0.5"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 + dayIndex * 0.05 }}
                        >
                            {/* Day label */}
                            <div className="text-xs text-gray-500 font-medium text-center py-1 pr-2">
                                {day}
                            </div>

                            {/* Data cells for each time slot */}
                            {mockHeatmapData[dayIndex].map((value, timeIndex) => (
                                <motion.div
                                    key={`${dayIndex}-${timeIndex}`}
                                    className={`
                                        w-10 h-10 rounded-sm border border-gray-200
                                        ${getColorIntensity(value)}
                                        hover:scale-110 transition-transform cursor-pointer
                                    `}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        duration: 0.2,
                                        delay: 0.6 + dayIndex * 0.05 + timeIndex * 0.02,
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    title={`${day} ${timeSlots[timeIndex]}: ${value} meetings`}
                                >
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-xs font-medium text-gray-700">
                                            {value > 0 ? value : ''}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ))}
                </div>

                {/* Legend */}
                <motion.div
                    className="mt-6 flex items-center justify-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 1.2 }}
                >
                    <span className="text-xs text-gray-500">Number of meetings</span>
                    <div className="flex items-center gap-1">
                        {[0, 3, 6, 9, 12].map((value) => (
                            <div
                                key={value}
                                className={`w-5 h-5 rounded-sm ${getColorIntensity(value)}`}
                                title={`${value}${value === 12 ? '+' : ''} meetings`}
                            />
                        ))}
                    </div>
                    <span className="text-xs text-gray-500">≥0 ≥6 ≥12</span>
                </motion.div>
            </motion.div>
        </div>
    );
}
