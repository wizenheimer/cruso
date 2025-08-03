'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { PersonalizationField } from './types';

interface PersonalizationStepProps {
    fields: PersonalizationField[];
    onUpdateFields: (fields: PersonalizationField[]) => void;
}

const PersonalizationStep = ({ fields, onUpdateFields }: PersonalizationStepProps) => {
    const [showMore, setShowMore] = useState(false);

    const updateField = (id: string, value: string) => {
        onUpdateFields(fields.map((field) => (field.id === id ? { ...field, value } : field)));
    };

    const primaryField = fields.find((field) => field.isPrimary);
    const additionalFields = fields.filter((field) => !field.isPrimary);

    return (
        <>
            <h1 className="text-2xl font-semibold mb-2 text-center">
                How would Cruso like to call you?
            </h1>
            <p className="text-base text-muted-foreground mb-8 text-center">
                Set your preferred name and signature for your emails
            </p>

            {/* Personalization Fields */}
            <div className="w-full space-y-6 mb-8">
                {/* Primary Field - Always Visible */}
                {primaryField && (
                    <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                    >
                        {showMore && (
                            <label className="block text-sm font-medium text-gray-700">
                                {primaryField.label}
                            </label>
                        )}
                        <Input
                            type="text"
                            value={primaryField.value}
                            onChange={(e) => updateField(primaryField.id, e.target.value)}
                            placeholder={primaryField.placeholder}
                            className="w-full text-base"
                        />
                    </motion.div>
                )}

                {/* Additional Fields - Collapsible */}
                <AnimatePresence>
                    {showMore && (
                        <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
                            {additionalFields.map((field, index) => (
                                <motion.div
                                    key={field.id}
                                    className="space-y-2"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.15, delay: 0.05 * index }}
                                >
                                    <label className="block text-sm font-medium text-gray-700">
                                        {field.label}
                                    </label>
                                    <Input
                                        type="text"
                                        value={field.value}
                                        onChange={(e) => updateField(field.id, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="w-full text-base"
                                    />
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

export default PersonalizationStep;
