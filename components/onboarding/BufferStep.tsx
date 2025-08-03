'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { BufferSetting } from './types';

interface BufferStepProps {
    buffers: BufferSetting[];
    onUpdateBuffers: (buffers: BufferSetting[]) => void;
}

const BUFFER_OPTIONS = [
    { value: '0', label: 'No buffer' },
    { value: '5', label: '5 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '180', label: '3 hours' },
    { value: '360', label: '6 hours' },
];

const BufferStep = ({ buffers, onUpdateBuffers }: BufferStepProps) => {
    const [showMore, setShowMore] = useState(true);
    const lastSyncedValue = useRef<string | null>(null);

    const updateBuffer = (id: string, value: string) => {
        onUpdateBuffers(
            buffers.map((buffer) => (buffer.id === id ? { ...buffer, value } : buffer)),
        );
    };

    const primaryBuffer = buffers.find((buffer) => buffer.isPrimary);
    const additionalBuffers = buffers.filter((buffer) => !buffer.isPrimary);

    // When collapsed, sync all additional buffers with the default value
    useEffect(() => {
        if (!showMore && primaryBuffer && primaryBuffer.value !== lastSyncedValue.current) {
            const updatedBuffers = buffers.map((buffer) => {
                if (!buffer.isPrimary) {
                    return { ...buffer, value: primaryBuffer.value };
                }
                return buffer;
            });

            // Check if any buffers actually need updating
            const needsUpdate = updatedBuffers.some(
                (buffer, index) => buffer.value !== buffers[index].value,
            );

            if (needsUpdate) {
                lastSyncedValue.current = primaryBuffer.value;
                onUpdateBuffers(updatedBuffers);
            }
        }
    }, [showMore, primaryBuffer, buffers, onUpdateBuffers]);

    return (
        <>
            <h1 className="text-2xl font-semibold mb-2 text-center">Usual Meeting Buffers</h1>
            <p className="text-base text-muted-foreground mb-8 text-center">
                Set your preferred buffer times for meetings
            </p>

            {/* Buffer Settings */}
            <div className="w-full space-y-6 mb-8">
                {/* Primary Buffer - Only visible when not showing more */}
                {primaryBuffer && !showMore && (
                    <motion.div
                        className="flex items-center justify-between"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                    >
                        <label className="text-sm font-medium text-gray-700 min-w-[140px]">
                            {primaryBuffer.label}
                        </label>
                        <Select
                            value={primaryBuffer.value}
                            onValueChange={(value) => updateBuffer(primaryBuffer.id, value)}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                {BUFFER_OPTIONS.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                        className="text-gray-900 hover:bg-gray-100"
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </motion.div>
                )}

                {/* Additional Buffers - Collapsible */}
                <AnimatePresence>
                    {showMore && (
                        <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
                            {additionalBuffers.map((buffer, index) => (
                                <motion.div
                                    key={buffer.id}
                                    className="flex items-center justify-between"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.15, delay: 0.05 * index }}
                                >
                                    <label className="text-sm font-medium text-gray-700 min-w-[140px]">
                                        {buffer.label}
                                    </label>
                                    <Select
                                        value={buffer.value}
                                        onValueChange={(value) => updateBuffer(buffer.id, value)}
                                    >
                                        <SelectTrigger className="w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                            {BUFFER_OPTIONS.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                    className="text-gray-900 hover:bg-gray-100"
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* See More/See Less Button */}
                <div className="flex justify-center pt-4">
                    <Button
                        variant="ghost"
                        onClick={() => setShowMore(!showMore)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                    >
                        {showMore ? 'See Less' : 'See More'}
                    </Button>
                </div>
            </div>
        </>
    );
};

export default BufferStep;
