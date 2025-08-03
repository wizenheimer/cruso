'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { NextButton } from '@/components/onboarding/NextButton';
import { apiClient } from '@/client/api';
import { authClient } from '@/client/auth';
import { showToast } from '@/lib/toast';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import {
    CalendarStep,
    BufferStep,
    PersonalizationStep,
    ScheduleStep,
    TimezoneStep,
    CompletionStep,
    ConnectedCalendar,
    BufferSetting,
    PersonalizationField,
    WeeklySchedule,
} from '@/components/onboarding';
import { FeatureSlide } from '@/components/onboarding/FeatureSlide';
import MailboxOverlay from '@/components/icons/dynamic/mail-overlay';
import EnvelopeOverlay from '@/components/icons/dynamic/envelope-overlay';
import ScheduleViewOverlay from '@/components/icons/dynamic/schedule-view-overlay';
import ScheduleHeatmapOverlay from '@/components/icons/dynamic/schedule-heatmap-overlay';
import WorldMapOverlay from '@/components/icons/dynamic/worldmap-overlay';
import Image from 'next/image';

interface ApiCalendarAccount {
    accountId: string;
    email: string;
    calendars: Array<{
        id: string;
        name: string;
        isPrimary: boolean;
        includeInAvailability: boolean;
    }>;
}

const totalSteps = 6;

// Feature descriptions for the final step
const features = [
    {
        description: 'Schedule meetings by simply emailing Cruso instead of using booking forms.',
    },
    {
        description: 'View your calendar and find events across all your connected calendars.',
    },
    {
        description: 'Update meeting details, add attendees, or change recurring schedules.',
    },
    {
        description: 'Find free time slots that work for everyone involved.',
    },
    {
        description: 'Reschedule meetings by suggesting new times through email.',
    },
    {
        description: 'Coordinate new meetings with multiple people via email.',
    },
    {
        description: 'Cancel meetings and notify everyone automatically.',
    },
    {
        description: 'Manage recurring meetings with flexible modification options.',
    },
];

// Component that uses useSearchParams
const OnboardingContent = () => {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const { currentStep: step, setCurrentStep: setStep } = useOnboardingStore();
    const [connectedCalendars, setConnectedCalendars] = useState<ConnectedCalendar[]>([]);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [buffers, setBuffers] = useState<BufferSetting[]>([
        { id: 'default', label: 'Default Meetings Buffer', value: '15', isPrimary: true },
        { id: 'virtual', label: 'Virtual Meetings Buffer', value: '15' },
        { id: 'inperson', label: 'In-person Meetings Buffer', value: '15' },
        { id: 'backtoback', label: 'Back to Back Meetings Buffer', value: '30' },
        { id: 'flight', label: 'Flight Schedules Buffer', value: '60' },
    ]);
    const [fields, setFields] = useState<PersonalizationField[]>([
        {
            id: 'nickname',
            label: 'Nickname',
            value: '',
            placeholder: 'What should we call you?',
            isPrimary: true,
        },
        {
            id: 'displayName',
            label: 'Display Name',
            value: '',
            placeholder: 'Your display name',
        },
        {
            id: 'signature',
            label: 'Signature',
            value: '',
            placeholder: 'Your AI assistant signature',
        },
    ]);

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

    const [timezone, setTimezone] = useState<string>('America/New_York');

    // Load existing data from APIs
    const loadOnboardingData = useCallback(async () => {
        try {
            setDataLoading(true);
            setError(null);

            // Load calendar connections
            const calendarResponse = await apiClient.getCalendarAccounts();
            if (calendarResponse.success && calendarResponse.data) {
                const calendarAccountsData = calendarResponse.data as ApiCalendarAccount[];
                const calendars = calendarAccountsData.map((account) => ({
                    id: account.accountId,
                    email: account.email,
                    provider: 'google' as const,
                }));
                setConnectedCalendars(calendars);
            }

            // Load existing preferences
            const preferencesResponse = await apiClient.getPreferences();
            if (preferencesResponse.success && preferencesResponse.data) {
                const responseData = preferencesResponse.data as Record<string, unknown>;
                const prefs = responseData.preferences as Record<string, unknown>;

                // Update buffer settings from preferences
                setBuffers((prev) => {
                    const updated = prev.map((buffer) => {
                        let newValue = buffer.value;
                        switch (buffer.id) {
                            case 'virtual':
                                newValue =
                                    (prefs.virtualBufferMinutes as number)?.toString() || '0';
                                break;
                            case 'inperson':
                                newValue =
                                    (prefs.inPersonBufferMinutes as number)?.toString() || '15';
                                break;
                            case 'backtoback':
                                newValue =
                                    (prefs.backToBackBufferMinutes as number)?.toString() || '0';
                                break;
                            case 'flight':
                                newValue = (prefs.flightBufferMinutes as number)?.toString() || '0';
                                break;
                            default:
                                break;
                        }
                        return { ...buffer, value: newValue };
                    });
                    return updated;
                });

                // Update personalization fields
                setFields((prev) => {
                    const updated = prev.map((field) => {
                        let newValue = field.value;
                        switch (field.id) {
                            case 'nickname':
                                newValue = (prefs.nickname as string) || '';
                                break;
                            case 'displayName':
                                newValue = (prefs.displayName as string) || '';
                                break;
                            case 'signature':
                                newValue = (prefs.signature as string) || '';
                                break;
                            default:
                                break;
                        }
                        return { ...field, value: newValue };
                    });
                    return updated;
                });

                // Update timezone from preferences
                if (prefs.timezone) {
                    setTimezone(prefs.timezone as string);
                }
            }

            // Load working hours schedule
            const availabilityResponse = await apiClient.getWorkingHours();
            if (availabilityResponse.success && availabilityResponse.data) {
                const workingHours = availabilityResponse.data as Array<{
                    id: number;
                    days: number[] | null;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    createdAt: string;
                    updatedAt: string;
                }>;

                // Convert working hours data to schedule format using utility function
                const { convertWorkingHoursToSchedule } = await import('@/lib/working-hours');
                const newSchedule = convertWorkingHoursToSchedule(
                    workingHours.map((avail) => ({
                        ...avail,
                        createdAt: new Date(avail.createdAt),
                        updatedAt: new Date(avail.updatedAt),
                    })),
                );

                setSchedule(newSchedule);
            }
        } catch {
            showToast.error('Failed to load onboarding data');
            setError('Failed to load onboarding data');
        } finally {
            setDataLoading(false);
        }
    }, []);

    // Load data on component mount and when returning from OAuth
    useEffect(() => {
        loadOnboardingData();
    }, [loadOnboardingData]);

    // Validate and restore step on mount
    useEffect(() => {
        // Ensure step is within valid range
        if (step < 1 || step > totalSteps) {
            setStep(1);
        }
    }, [step, setStep]);

    // Clear browser history to prevent back navigation
    useEffect(() => {
        // Replace the current history entry so back button doesn't work
        window.history.replaceState(null, '', window.location.href);

        // Handle back button clicks
        const handlePopState = () => {
            // Replace the history entry again if user somehow gets back
            window.history.replaceState(null, '', window.location.href);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    // Check for OAuth callback and refresh calendar data
    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'linked') {
            // Refresh calendar data after OAuth callback
            loadOnboardingData();
        }
    }, [searchParams, loadOnboardingData]);

    const saveBufferSettings = useCallback(async () => {
        const prefsData = {
            virtualBufferMinutes: parseInt(buffers.find((b) => b.id === 'virtual')?.value || '0'),
            inPersonBufferMinutes: parseInt(
                buffers.find((b) => b.id === 'inperson')?.value || '15',
            ),
            backToBackBufferMinutes: parseInt(
                buffers.find((b) => b.id === 'backtoback')?.value || '0',
            ),
            flightBufferMinutes: parseInt(buffers.find((b) => b.id === 'flight')?.value || '0'),
            minNoticeMinutes: 120,
            maxDaysAhead: 60,
            defaultMeetingDurationMinutes: 30,
            isActive: true,
        };

        // Try to update existing preferences, if not found create new ones
        const response = await apiClient.updatePreferences(prefsData);
        if (!response.success) {
            await apiClient.createPreferences(prefsData);
        }
    }, [buffers]);

    const savePersonalizationData = useCallback(async () => {
        const prefsData = {
            displayName: fields.find((f) => f.id === 'displayName')?.value || '',
            nickname: fields.find((f) => f.id === 'nickname')?.value || '',
            signature: fields.find((f) => f.id === 'signature')?.value || '',
        };

        const response = await apiClient.updatePreferences(prefsData);
        if (!response.success) {
            await apiClient.createPreferences(prefsData);
        }
    }, [fields]);

    const saveScheduleData = useCallback(async () => {
        // Clear existing working hours first
        const existingAvailability = await apiClient.getWorkingHours();
        if (existingAvailability.success && existingAvailability.data) {
            const existing = existingAvailability.data as Array<{ id: number }>;
            for (const avail of existing) {
                await apiClient.deleteWorkingHours(avail.id);
            }
        }

        // Convert schedule to working hours format using utility function
        const { convertScheduleToWorkingHours } = await import('@/lib/working-hours');
        const workingHoursData = convertScheduleToWorkingHours(schedule);

        // Create new working hours records
        for (const avail of workingHoursData) {
            await apiClient.createWorkingHours({
                days: avail.days,
                startTime: avail.startTime,
                endTime: avail.endTime,
            });
        }
    }, [schedule]);

    const saveTimezoneData = useCallback(async () => {
        const prefsData = {
            timezone: timezone,
        };

        const response = await apiClient.updatePreferences(prefsData);
        if (!response.success) {
            await apiClient.createPreferences(prefsData);
        }
    }, [timezone]);

    const finalizeOnboarding = useCallback(async () => {
        // Generate preferences document and mark onboarding as complete
        const documentResponse = await apiClient.generatePreferencesDocument();

        if (!documentResponse.success) {
            const errorMessage =
                documentResponse.error || 'Failed to generate preferences document';
            showToast.error(errorMessage);
            throw new Error(errorMessage);
        }
    }, []);

    // Save current step data to API
    const saveCurrentStepData = useCallback(async () => {
        switch (step) {
            case 1:
                // Calendar step - no additional saving needed (OAuth handles this)
                break;
            case 2:
                // Buffer step - save preferences
                await saveBufferSettings();
                break;
            case 3:
                // Personalization step - save preferences
                await savePersonalizationData();
                break;
            case 4:
                // Timezone step - save preferences
                await saveTimezoneData();
                break;
            case 5:
                // Schedule step - save availability
                await saveScheduleData();
                break;
            case 6:
                // Completion step - finalize onboarding
                await finalizeOnboarding();
                break;
        }
    }, [
        step,
        saveBufferSettings,
        savePersonalizationData,
        saveTimezoneData,
        saveScheduleData,
        finalizeOnboarding,
    ]);

    // Handle next step for the onboarding flow
    const handleNext = useCallback(async () => {
        setLoading(true);

        try {
            // Save current step data before proceeding
            await saveCurrentStepData();

            if (step < totalSteps) {
                setStep(step + 1);
            } else {
                // Skipped for now
                // Clear local storage and reset step before navigating to dashboard
                // clearStorage();
                // Navigate to dashboard on last step
                window.location.href = '/dashboard';
            }
            setLoading(false);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to save step data';
            showToast.error(errorMessage);
            setError(errorMessage);
            setLoading(false);
        }
    }, [step, saveCurrentStepData, setStep]);

    // Handle adding calendar during onboarding
    const handleAddCalendar = async () => {
        try {
            setError(null);

            const response = await authClient.linkSocial({
                provider: 'google',
                callbackURL: '/get-started?action=linked&step=1',
                fetchOptions: {
                    onError: () => {
                        showToast.error('Failed to link Google account. Please try again.');
                    },
                },
            });

            if (response.error) {
                throw new Error(response.error.message || 'Failed to link account');
            }

            if (response.data?.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to link account';
            showToast.error(errorMessage);
            setError(errorMessage);
        }
    };

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
                        onAddCalendar={handleAddCalendar}
                        onError={setError}
                    />
                );
            case 2:
                return <BufferStep buffers={buffers} onUpdateBuffers={setBuffers} />;
            case 3:
                return <PersonalizationStep fields={fields} onUpdateFields={setFields} />;
            case 4:
                return <TimezoneStep timezone={timezone} onUpdateTimezone={setTimezone} />;
            case 5:
                return <ScheduleStep schedule={schedule} onUpdateSchedule={setSchedule} />;
            case 6:
                return <CompletionStep />;
            default:
                return null;
        }
    };

    const renderRightHalfContent = () => {
        switch (step) {
            case 1:
                return (
                    <MailboxOverlay
                        emailAddresses={connectedCalendars.map((calendar) => calendar.email)}
                        typeSpeed={100}
                        deleteSpeed={50}
                        pauseDuration={1000}
                    />
                );
            case 2:
                return <ScheduleViewOverlay />;
            case 3:
                return (
                    <EnvelopeOverlay
                        name={fields.find((f) => f.id === 'nickname')?.value || 'there'}
                        typeSpeed={100}
                        deleteSpeed={50}
                        pauseDuration={1000}
                    />
                );
            case 4:
                // Timezone step - show worldmap overlay
                return <WorldMapOverlay />;
            case 5:
                return <ScheduleHeatmapOverlay />;
            case 6:
                // Completion step - no overlay needed
                return null;
            default:
                return null;
        }
    };

    if (dataLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading onboarding data...</p>
                </div>
            </div>
        );
    }

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

                {/* Error Message */}
                {error && (
                    <div className="absolute top-20 left-0 right-0 mx-8 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-600 hover:text-red-800 text-sm underline mt-2"
                        >
                            Dismiss
                        </button>
                    </div>
                )}
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
                {step === totalSteps ? (
                    // For step 6, use the signup page layout
                    <>
                        <motion.div
                            className="px-8 xl:px-16 pt-8 xl:pt-16 pb-4 w-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
                        >
                            <FeatureSlide
                                features={features}
                                autoPlay={true}
                                interval={5000}
                                showNavigation={true}
                                className="w-full"
                            />
                        </motion.div>

                        {/* Image Section - clean sneak peek effect */}
                        <div className="absolute bottom-0 right-0 w-full h-full flex items-end justify-end">
                            <motion.div
                                className="relative w-[75%] h-[60%] transform translate-x-[8%] translate-y-[8%]"
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                            >
                                <Image
                                    src="/images/assets/onboarding/preview.svg"
                                    alt="Cruso Preview"
                                    fill
                                    className="object-cover rounded-xl shadow-2xl object-left-top"
                                    priority
                                    sizes="(max-width: 1024px) 50vw, 40vw"
                                />
                            </motion.div>
                        </div>
                    </>
                ) : (
                    // For other steps, use the original centered layout
                    <div className="flex items-center justify-center w-full h-full p-8">
                        <div
                            className={`h-auto max-w-full ${step === 4 ? 'w-full max-w-2xl' : 'w-96'}`}
                        >
                            {renderRightHalfContent()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const OnboardingPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OnboardingContent />
        </Suspense>
    );
};

export default OnboardingPage;
