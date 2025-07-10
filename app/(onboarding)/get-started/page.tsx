'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { NextButton } from '@/components/onboarding/NextButton';
import {
    CalendarStep,
    BufferStep,
    PersonalizationStep,
    ScheduleStep,
    CompletionStep,
    ConnectedCalendar,
    BufferSetting,
    PersonalizationField,
    WeeklySchedule,
} from '@/components/onboarding';

const currentStep = 1;
const totalSteps = 5;

const OnboardingPage = () => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(currentStep);
    const [connectedCalendars, setConnectedCalendars] = useState<ConnectedCalendar[]>([
        { id: '1', email: 'byrdhq.dev@gmail.com', provider: 'google' },
        { id: '2', email: 'nayan.kumar@gmail.com', provider: 'google' },
        { id: '3', email: 'doodle.fang@gmail.com', provider: 'google' },
    ]);
    const [buffers, setBuffers] = useState<BufferSetting[]>([
        { id: 'general', label: 'Meeting Buffer', value: '25', isPrimary: true },
        { id: 'virtual', label: 'Virtual Meetings', value: '25' },
        { id: 'inperson', label: 'In-person Meetings', value: '25' },
        { id: 'backtoback', label: 'Back to Back Meetings', value: '25' },
        { id: 'flight', label: 'Flight Schedules', value: '25' },
    ]);
    const [fields, setFields] = useState<PersonalizationField[]>([
        {
            id: 'nickname',
            label: 'Nickname',
            value: 'Sarah',
            placeholder: 'What should we call you?',
            isPrimary: true,
        },
        {
            id: 'displayName',
            label: 'Display Name',
            value: 'Sarah',
            placeholder: 'Your display name',
        },
        {
            id: 'signature',
            label: 'Signature',
            value: "Sarah's AI Assistant",
            placeholder: 'Your AI assistant signature',
        },
    ]);
    const [timezone, setTimezone] = useState('America/New_York');
    const [userName] = useState('Sarah');
    const [userEmail] = useState('sarah@example.com');
    const [schedule, setSchedule] = useState<WeeklySchedule>({
        Monday: { enabled: true, timeSlots: [{ id: '1', startTime: '09:00', endTime: '17:00' }] },
        Tuesday: { enabled: true, timeSlots: [{ id: '2', startTime: '09:00', endTime: '17:00' }] },
        Wednesday: {
            enabled: true,
            timeSlots: [{ id: '3', startTime: '09:00', endTime: '17:00' }],
        },
        Thursday: { enabled: true, timeSlots: [{ id: '4', startTime: '09:00', endTime: '17:00' }] },
        Friday: { enabled: true, timeSlots: [{ id: '5', startTime: '09:00', endTime: '17:00' }] },
        Saturday: {
            enabled: false,
            timeSlots: [{ id: '6', startTime: '09:00', endTime: '17:00' }],
        },
        Sunday: { enabled: false, timeSlots: [{ id: '7', startTime: '09:00', endTime: '17:00' }] },
    });

    // Handle next step for the onboarding flow
    const handleNext = useCallback(async () => {
        setLoading(true);

        try {
            // TODO: Implement next step
            if (step < totalSteps) {
                setStep(step + 1);
            } else {
                // Navigate to dashboard on last step
                window.location.href = '/dashboard';
            }
            setLoading(false);
        } catch (error) {
            console.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to proceed to next step. Please try again.',
            );
            setLoading(false);
        }
    }, [step]);

    // Handle step navigation
    const handleStepClick = (stepNumber: number) => {
        setStep(stepNumber);
    };

    // Add keyboard shortcut for Cmd+Enter
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !loading) {
                event.preventDefault();
                handleNext();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [loading, handleNext]);

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <CalendarStep
                        connectedCalendars={connectedCalendars}
                        onUpdateCalendars={setConnectedCalendars}
                    />
                );
            case 2:
                return <BufferStep buffers={buffers} onUpdateBuffers={setBuffers} />;
            case 3:
                return <PersonalizationStep fields={fields} onUpdateFields={setFields} />;
            case 4:
                return (
                    <ScheduleStep
                        schedule={schedule}
                        onUpdateSchedule={setSchedule}
                        timezone={timezone}
                        onUpdateTimezone={setTimezone}
                    />
                );
            case 5:
                return <CompletionStep userName={userName} userEmail={userEmail} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex min-h-screen">
            {/* Left side - Nav and centered card */}
            <div className="flex flex-1 flex-col bg-white relative">
                {/* Nav */}
                <nav className="absolute top-0 left-0 w-full flex items-center justify-between h-20 px-8">
                    <Link href="/" className="text-xl font-semibold">
                        Cruso
                    </Link>
                    <NextButton
                        onClick={handleNext}
                        loading={loading}
                        isLastStep={step === totalSteps}
                    />
                </nav>
                {/* Centered onboarding card */}
                <motion.div
                    className="flex flex-1 flex-col items-center justify-center min-h-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                    <motion.div
                        className="w-full max-w-md flex flex-col items-center"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
                    >
                        {renderStepContent()}
                    </motion.div>

                    {/* Step indicators - Footer */}
                    <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 text-center px-4">
                        <div className="flex items-center justify-center gap-3">
                            {Array.from({ length: totalSteps }, (_, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleStepClick(index + 1)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 hover:scale-110 ${
                                        index + 1 === step ? 'bg-black scale-110' : 'bg-gray-300'
                                    }`}
                                    aria-label={`Go to step ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Right side - Testimonial and Image */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden flex-col justify-start rounded-l-2xl">
                {/* Add right side content */}
            </div>
        </div>
    );
};

export default OnboardingPage;
