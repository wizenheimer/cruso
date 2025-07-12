'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';

import { TimeSlot, WeeklySchedule } from './types';

interface ScheduleStepProps {
    schedule: WeeklySchedule;
    onUpdateSchedule: (schedule: WeeklySchedule) => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Generate time options from 00:00 to 23:30 in 30-minute intervals
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    // Format for display
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;

    return { value: timeString, label: displayTime };
});

const ScheduleStep = ({ schedule, onUpdateSchedule }: ScheduleStepProps) => {
    // Initialize with no days collapsed so users can see the time slots
    const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');
        const hour = Number.parseInt(hours);
        const ampm = hour >= 12 ? 'pm' : 'am';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes}${ampm}`;
    };

    const toggleDay = (day: string) => {
        const newEnabled = !schedule[day].enabled;
        onUpdateSchedule({
            ...schedule,
            [day]: {
                ...schedule[day],
                enabled: newEnabled,
                // Ensure there's at least one time slot when enabling a day
                timeSlots:
                    newEnabled && schedule[day].timeSlots.length === 0
                        ? [{ id: `${day}-${Date.now()}`, startTime: '09:00', endTime: '17:00' }]
                        : schedule[day].timeSlots,
            },
        });
    };

    const updateTimeSlot = (
        day: string,
        slotId: string,
        field: 'startTime' | 'endTime',
        value: string,
    ) => {
        onUpdateSchedule({
            ...schedule,
            [day]: {
                ...schedule[day],
                timeSlots: schedule[day].timeSlots.map((slot) =>
                    slot.id === slotId ? { ...slot, [field]: value } : slot,
                ),
            },
        });
    };

    const addTimeSlot = (day: string) => {
        const newSlot: TimeSlot = {
            id: `${day}-${Date.now()}`,
            startTime: '09:00',
            endTime: '17:00',
        };
        onUpdateSchedule({
            ...schedule,
            [day]: {
                ...schedule[day],
                timeSlots: [...schedule[day].timeSlots, newSlot],
            },
        });
    };

    const removeTimeSlot = (day: string, slotId: string) => {
        const newTimeSlots = schedule[day].timeSlots.filter((slot) => slot.id !== slotId);

        // Don't allow removing the last time slot - disable the day instead
        if (newTimeSlots.length === 0) {
            onUpdateSchedule({
                ...schedule,
                [day]: {
                    ...schedule[day],
                    enabled: false,
                    timeSlots: [],
                },
            });
        } else {
            onUpdateSchedule({
                ...schedule,
                [day]: {
                    ...schedule[day],
                    timeSlots: newTimeSlots,
                },
            });
        }
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

    return (
        <>
            <h1 className="text-2xl font-semibold mb-2 text-center">Usual Working Hours</h1>
            <p className="text-base text-muted-foreground mb-8 text-center">
                Set your typical working hours for each day of the week
            </p>

            {/* Working Hours Configuration */}
            <div className="w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Hours
                </label>
                <div className="w-full mb-4 border rounded-lg overflow-hidden">
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
                                                daySchedule.enabled ? 'bg-black' : 'bg-gray-200'
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
                                            className="ml-10 space-y-3"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {daySchedule.timeSlots.map((slot) => (
                                                <div
                                                    key={slot.id}
                                                    className="flex items-center gap-3"
                                                >
                                                    {/* Start Time Select */}
                                                    <Select
                                                        value={slot.startTime}
                                                        onValueChange={(value) =>
                                                            updateTimeSlot(
                                                                day,
                                                                slot.id,
                                                                'startTime',
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                                                            {TIME_OPTIONS.map((option) => (
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

                                                    <span className="text-gray-400 text-sm">
                                                        to
                                                    </span>

                                                    {/* End Time Select */}
                                                    <Select
                                                        value={slot.endTime}
                                                        onValueChange={(value) =>
                                                            updateTimeSlot(
                                                                day,
                                                                slot.id,
                                                                'endTime',
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60">
                                                            {TIME_OPTIONS.map((option) => (
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

                                                    {/* Remove Button */}
                                                    {daySchedule.timeSlots.length > 1 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                removeTimeSlot(day, slot.id)
                                                            }
                                                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                                            title="Remove time slot"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Add Button - positioned outside the time slot loop */}
                                            <div className="flex items-center gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => addTimeSlot(day)}
                                                    className="h-8 px-3 text-xs hover:bg-gray-50"
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Add Time Slot
                                                </Button>
                                            </div>
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
        </>
    );
};

export default ScheduleStep;
