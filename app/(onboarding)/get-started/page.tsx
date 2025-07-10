'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { Trash2, Plus } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, ArrowUpRight } from 'lucide-react';

const currentStep = 1;
const totalSteps = 5;

interface ConnectedCalendar {
    id: string;
    email: string;
    provider: 'google';
}

interface BufferSetting {
    id: string;
    label: string;
    value: string;
    isPrimary?: boolean;
}

interface PersonalizationField {
    id: string;
    label: string;
    value: string;
    placeholder: string;
    isPrimary?: boolean;
}

interface TimeSlot {
    id: string;
    startTime: string;
    endTime: string;
}

interface DaySchedule {
    enabled: boolean;
    timeSlots: TimeSlot[];
}

interface WeeklySchedule {
    [key: string]: DaySchedule;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ALL_TIMEZONES =
    typeof Intl !== 'undefined' && Intl.supportedValuesOf
        ? Intl.supportedValuesOf('timeZone').map((tz) => ({
              value: tz,
              label: tz.replace(/_/g, ' '),
          }))
        : [
              { value: 'America/New_York', label: 'America/New York' },
              { value: 'Europe/London', label: 'Europe/London' },
          ];

const BUFFER_OPTIONS = [
    { value: '0', label: 'No buffer' },
    { value: '5', label: '5 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '20', label: '20 minutes' },
    { value: '25', label: '25 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
];

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(currentStep);
    const [addingCalendar, setAddingCalendar] = useState(false);
    const [connectedCalendars, setConnectedCalendars] = useState<ConnectedCalendar[]>([
        { id: '1', email: 'byrdhq.dev@gmail.com', provider: 'google' },
        { id: '2', email: 'nayan.kumar@gmail.com', provider: 'google' },
        { id: '3', email: 'doodle.fang@gmail.com', provider: 'google' },
    ]);
    const [showMore, setShowMore] = useState(false);
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
    const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set(DAYS_OF_WEEK));

    const addMoreCalendar = async () => {
        setAddingCalendar(true);
        try {
            const response = await authClient.signIn.social({
                provider: 'google',
                callbackURL: '/onboarding/calendar',
            });

            if (response?.error) {
                throw new Error(response.error.message || 'Authentication failed');
            }

            if (response?.data?.url) {
                window.location.href = response.data.url;
                return;
            }

            console.error('Failed to get Google OAuth URL. Please try again.');
            setAddingCalendar(false);
        } catch (error) {
            console.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to add calendar. Please try again.',
            );
            setAddingCalendar(false);
        }
    };

    const removeCalendar = (id: string) => {
        setConnectedCalendars((prev) => prev.filter((cal) => cal.id !== id));
    };

    const updateBuffer = (id: string, value: string) => {
        setBuffers((prev) =>
            prev.map((buffer) => (buffer.id === id ? { ...buffer, value } : buffer)),
        );
    };

    const updateField = (id: string, value: string) => {
        setFields((prev) => prev.map((field) => (field.id === id ? { ...field, value } : field)));
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = Number.parseInt(hours);
        const ampm = hour >= 12 ? 'pm' : 'am';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes}${ampm}`;
    };

    const toggleDay = (day: string) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                enabled: !prev[day].enabled,
            },
        }));
    };

    const updateTimeSlot = (
        day: string,
        slotId: string,
        field: 'startTime' | 'endTime',
        value: string,
    ) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                timeSlots: prev[day].timeSlots.map((slot) =>
                    slot.id === slotId ? { ...slot, [field]: value } : slot,
                ),
            },
        }));
    };

    const addTimeSlot = (day: string) => {
        const newSlot: TimeSlot = {
            id: `${day}-${Date.now()}`,
            startTime: '09:00',
            endTime: '17:00',
        };
        setSchedule((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                timeSlots: [...prev[day].timeSlots, newSlot],
            },
        }));
    };

    const removeTimeSlot = (day: string, slotId: string) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                timeSlots: prev[day].timeSlots.filter((slot) => slot.id !== slotId),
            },
        }));
    };

    const toggleCollapse = (day: string) => {
        setCollapsedDays((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(day)) {
                newSet.delete(day);
            } else {
                newSet.add(day);
            }
            return newSet;
        });
    };

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

    const getProviderIcon = () => {
        return (
            <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                </svg>
            </div>
        );
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <h1 className="text-2xl font-semibold mb-2 text-center">
                            Connect More Calendar
                        </h1>
                        <p className="text-base text-muted-foreground mb-8 text-center">
                            Quick auth and we&apos;ll make it official
                        </p>

                        {/* Connected Calendars List */}
                        <div className="w-full space-y-3 mb-6">
                            {connectedCalendars.map((calendar, index) => (
                                <motion.div
                                    key={calendar.id}
                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
                                >
                                    <div className="flex items-center gap-3">
                                        {getProviderIcon()}
                                        <span className="text-sm font-medium text-gray-900">
                                            {calendar.email}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeCalendar(calendar.id)}
                                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            ))}
                        </div>

                        {/* Add More Button */}
                        <Button
                            onClick={addMoreCalendar}
                            disabled={addingCalendar}
                            variant="ghost"
                            className="w-full h-12 text-base font-normal justify-center border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                        >
                            {addingCalendar ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Connecting...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Plus className="w-5 h-5" />
                                    Add More
                                </div>
                            )}
                        </Button>
                    </>
                );
            case 2:
                const primaryBuffer = buffers.find((buffer) => buffer.isPrimary);
                const additionalBuffers = buffers.filter((buffer) => !buffer.isPrimary);

                return (
                    <>
                        <h1 className="text-2xl font-semibold mb-2 text-center">
                            Usual Meeting Buffers
                        </h1>
                        <p className="text-base text-muted-foreground mb-8 text-center">
                            Quick auth and we&apos;ll make it official
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
                                        onValueChange={(value) =>
                                            updateBuffer(primaryBuffer.id, value)
                                        }
                                    >
                                        <SelectTrigger className="w-48">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BUFFER_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
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
                                                    onValueChange={(value) =>
                                                        updateBuffer(buffer.id, value)
                                                    }
                                                >
                                                    <SelectTrigger className="w-48">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {BUFFER_OPTIONS.map((option) => (
                                                            <SelectItem
                                                                key={option.value}
                                                                value={option.value}
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
                                    className="text-sm text-muted-foreground hover:text-gray-700"
                                >
                                    {showMore ? 'See Less' : 'See More'}
                                </Button>
                            </div>
                        </div>
                    </>
                );
            case 3:
                const primaryField = fields.find((field) => field.isPrimary);
                const additionalFields = fields.filter((field) => !field.isPrimary);

                return (
                    <>
                        <h1 className="text-2xl font-semibold mb-2 text-center">
                            How would Cruso like to call you?
                        </h1>
                        <p className="text-base text-muted-foreground mb-8 text-center">
                            Quick auth and we&apos;ll make it official
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
                                        onChange={(e) =>
                                            updateField(primaryField.id, e.target.value)
                                        }
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
                                                    onChange={(e) =>
                                                        updateField(field.id, e.target.value)
                                                    }
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
                                    className="text-sm text-muted-foreground hover:text-gray-700"
                                >
                                    {showMore ? 'See Less' : 'See More'}
                                </Button>
                            </div>
                        </div>
                    </>
                );
            case 4:
                return (
                    <>
                        <h1 className="text-2xl font-semibold mb-2 text-center">
                            Usual Working Hours
                        </h1>
                        <p className="text-base text-muted-foreground mb-8 text-center">
                            Quick auth and we&apos;ll make it official
                        </p>

                        {/* Working Hours Configuration */}
                        <div className="w-full mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Working Hours
                            </label>
                            <div className="w-full mb-8 border rounded-lg overflow-hidden">
                                <div className="max-h-80 overflow-y-auto p-6 space-y-4">
                                    {DAYS_OF_WEEK.map((day, index) => {
                                        const isCollapsed = collapsedDays.has(day);
                                        const daySchedule = schedule[day];

                                        return (
                                            <motion.div
                                                key={day}
                                                className="space-y-3 border-b border-gray-100 last:border-b-0 pb-4 last:pb-0"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{
                                                    duration: 0.2,
                                                    delay: 0.1 + index * 0.05,
                                                }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {/* Toggle Switch */}
                                                    <button
                                                        onClick={() => toggleDay(day)}
                                                        className={`w-11 h-6 rounded-full transition-colors ${
                                                            daySchedule.enabled
                                                                ? 'bg-black'
                                                                : 'bg-gray-200'
                                                        } relative`}
                                                    >
                                                        <div
                                                            className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                                                daySchedule.enabled
                                                                    ? 'translate-x-5'
                                                                    : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>

                                                    {/* Day Label with Collapse Button */}
                                                    <div className="flex items-center gap-2 min-w-[140px]">
                                                        <button
                                                            onClick={() => toggleCollapse(day)}
                                                            className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors"
                                                            disabled={!daySchedule.enabled}
                                                        >
                                                            {daySchedule.enabled ? (
                                                                isCollapsed ? (
                                                                    <ChevronRight className="w-4 h-4" />
                                                                ) : (
                                                                    <ChevronDown className="w-4 h-4" />
                                                                )
                                                            ) : (
                                                                <div className="w-4 h-4" />
                                                            )}
                                                            <span>{day}</span>
                                                        </button>
                                                    </div>

                                                    {/* Quick Preview when collapsed or disabled */}
                                                    {(isCollapsed || !daySchedule.enabled) && (
                                                        <div className="flex-1 text-sm text-gray-500">
                                                            {!daySchedule.enabled
                                                                ? 'Not available'
                                                                : `${daySchedule.timeSlots.length} slot${daySchedule.timeSlots.length !== 1 ? 's' : ''} • ${formatTime(daySchedule.timeSlots[0]?.startTime || '09:00')} - ${formatTime(daySchedule.timeSlots[daySchedule.timeSlots.length - 1]?.endTime || '17:00')}`}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Collapsible Time Slots */}
                                                {daySchedule.enabled && !isCollapsed && (
                                                    <motion.div
                                                        className="ml-10 space-y-2"
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        {daySchedule.timeSlots.map((slot) => (
                                                            <div
                                                                key={slot.id}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Input
                                                                    type="time"
                                                                    value={slot.startTime}
                                                                    onChange={(e) =>
                                                                        updateTimeSlot(
                                                                            day,
                                                                            slot.id,
                                                                            'startTime',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    className="w-32 text-sm"
                                                                />
                                                                <span className="text-gray-400">
                                                                    —
                                                                </span>
                                                                <Input
                                                                    type="time"
                                                                    value={slot.endTime}
                                                                    onChange={(e) =>
                                                                        updateTimeSlot(
                                                                            day,
                                                                            slot.id,
                                                                            'endTime',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    className="w-32 text-sm"
                                                                />

                                                                {/* Action Buttons */}
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            addTimeSlot(day)
                                                                        }
                                                                        className="h-8 w-8 p-0 hover:bg-gray-100"
                                                                        title="Add time slot"
                                                                    >
                                                                        <Plus className="w-4 h-4" />
                                                                    </Button>
                                                                    {daySchedule.timeSlots.length >
                                                                        1 && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                removeTimeSlot(
                                                                                    day,
                                                                                    slot.id,
                                                                                )
                                                                            }
                                                                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                                                            title="Remove time slot"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Scroll indicator */}
                                <div className="px-6 py-2 bg-gray-50 border-t text-xs text-gray-500 text-center">
                                    Click day names to expand • Scroll for more days
                                </div>
                            </div>
                        </div>

                        {/* Timezone Selection */}
                        <div className="w-full mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Timezone
                            </label>
                            <Select value={timezone} onValueChange={setTimezone}>
                                <SelectTrigger className="w-full bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white max-h-72 overflow-y-auto">
                                    {ALL_TIMEZONES.map((tz) => (
                                        <SelectItem key={tz.value} value={tz.value}>
                                            {tz.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                );
            case 5:
                return (
                    <>
                        <h1 className="text-2xl font-semibold mb-2 text-center">
                            And you&apos;re in
                        </h1>
                        <p className="text-base text-muted-foreground mb-8 text-center">
                            Cruso is now added to your Team
                        </p>

                        {/* User info */}
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                    {userName
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')}
                                </span>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">{userName}</div>
                                <div className="text-xs text-gray-500">{userEmail}</div>
                            </div>
                        </div>
                    </>
                );
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
                    <div className="relative group">
                        <Button
                            onClick={handleNext}
                            disabled={loading}
                            className="h-9 px-4 text-sm font-medium"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Saving...
                                </div>
                            ) : step === totalSteps ? (
                                <div className="flex items-center gap-2">
                                    Get Started
                                    <ArrowUpRight className="w-4 h-4" />
                                </div>
                            ) : (
                                'Next'
                            )}
                        </Button>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <div className="text-xs text-gray-500 whitespace-nowrap">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-2 py-1 bg-gray-100 rounded">⌘</kbd>
                                    <span>+</span>
                                    <kbd className="px-2 py-1 bg-gray-100 rounded">↵</kbd>
                                </span>
                            </div>
                        </div>
                    </div>
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

export default LoginPage;
