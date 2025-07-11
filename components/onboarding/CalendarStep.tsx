'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { Trash2, Plus } from 'lucide-react';

import { ConnectedCalendar } from './types';

interface CalendarStepProps {
    connectedCalendars: ConnectedCalendar[];
    onUpdateCalendars: (calendars: ConnectedCalendar[]) => void;
    onAddCalendar?: () => void;
}

const CalendarStep = ({
    connectedCalendars,
    onUpdateCalendars,
    onAddCalendar,
}: CalendarStepProps) => {
    const [addingCalendar, setAddingCalendar] = useState(false);

    const addMoreCalendar = async () => {
        // If onAddCalendar prop is provided, use it instead of internal logic
        if (onAddCalendar) {
            onAddCalendar();
            return;
        }

        // Fallback to internal logic for backward compatibility
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
        onUpdateCalendars(connectedCalendars.filter((cal) => cal.id !== id));
    };

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

    return (
        <>
            <h1 className="text-2xl font-semibold mb-2 text-center">Connect More Calendar</h1>
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
                disabled={addingCalendar && !onAddCalendar}
                variant="ghost"
                className="w-full h-12 text-base font-normal justify-center border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            >
                {addingCalendar && !onAddCalendar ? (
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
};

export default CalendarStep;
