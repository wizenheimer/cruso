'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { NextButton } from '@/components/onboarding/NextButton';
import { apiClient } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';
import { showToast } from '@/lib/toast';
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

const currentStep = 1;
const totalSteps = 5;

// Component that uses useSearchParams
const OnboardingContent = () => {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(currentStep);
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

    // Load existing data from APIs
    const loadOnboardingData = useCallback(async () => {
        try {
            setDataLoading(true);
            setError(null);

            // Load calendar connections
            console.log('┌─ [API] Loading calendar connections...');
            const calendarResponse = await apiClient.getCalendarAccounts();
            console.log('├─ [API] Calendar connections response:', {
                success: calendarResponse.success,
                dataLength: Array.isArray(calendarResponse.data) ? calendarResponse.data.length : 0,
                error: calendarResponse.error,
            });
            if (calendarResponse.success && calendarResponse.data) {
                const calendarAccountsData = calendarResponse.data as ApiCalendarAccount[];
                const calendars = calendarAccountsData.map((account) => ({
                    id: account.accountId,
                    email: account.email,
                    provider: 'google' as const,
                }));
                setConnectedCalendars(calendars);
                console.log(
                    '└─ [API] Successfully loaded',
                    calendars.length,
                    'calendar connections',
                );
            } else {
                console.log('└─ [API] Failed to load calendar connections');
            }

            // Load existing preferences
            console.log('┌─ [API] Loading existing preferences...');
            const preferencesResponse = await apiClient.getPreferences();
            console.log('├─ [API] Preferences response:', {
                success: preferencesResponse.success,
                hasData: !!preferencesResponse.data,
                data: preferencesResponse.data,
                error: preferencesResponse.error,
            });
            if (preferencesResponse.success && preferencesResponse.data) {
                const responseData = preferencesResponse.data as Record<string, unknown>;
                const prefs = responseData.preferences as Record<string, unknown>;
                console.log('├─ [API] Parsed preferences data:', prefs);

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
                        console.log(`├─ [API] Buffer ${buffer.id}: ${buffer.value} -> ${newValue}`);
                        return { ...buffer, value: newValue };
                    });
                    console.log('├─ [API] Updated buffers:', updated);
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
                        console.log(`├─ [API] Field ${field.id}: ${field.value} -> ${newValue}`);
                        return { ...field, value: newValue };
                    });
                    console.log('├─ [API] Updated fields:', updated);
                    return updated;
                });

                console.log('└─ [API] Successfully loaded existing preferences');
            } else {
                console.log('└─ [API] No existing preferences found or error occurred');
            }

            // Load availability schedule
            console.log('┌─ [API] Loading availability schedule...');
            const availabilityResponse = await apiClient.getAvailability();
            console.log('├─ [API] Availability response:', {
                success: availabilityResponse.success,
                dataLength: Array.isArray(availabilityResponse.data)
                    ? availabilityResponse.data.length
                    : 0,
                error: availabilityResponse.error,
            });
            if (availabilityResponse.success && availabilityResponse.data) {
                const availability = availabilityResponse.data as Array<{
                    id: number;
                    days: number[] | null;
                    startTime: string;
                    endTime: string;
                    timezone: string;
                    createdAt: string;
                    updatedAt: string;
                }>;

                // Convert availability data to schedule format using utility function
                const { convertAvailabilityToSchedule } = await import('@/lib/availability-utils');
                const newSchedule = convertAvailabilityToSchedule(
                    availability.map((avail) => ({
                        ...avail,
                        createdAt: new Date(avail.createdAt),
                        updatedAt: new Date(avail.updatedAt),
                    })),
                );

                setSchedule(newSchedule);
                console.log('└─ [API] Successfully loaded availability schedule:', newSchedule);
            } else {
                console.log('└─ [API] No existing availability schedule found');
            }
        } catch (error) {
            console.error('Error loading onboarding data:', error);
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
            console.log('┌─ [OAUTH] Detected OAuth callback, refreshing calendar data...');
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
        console.log('┌─ [API] Saving buffer settings...');
        const response = await apiClient.updatePreferences(prefsData);
        console.log('├─ [API] Update preferences response:', {
            success: response.success,
            error: response.error,
        });
        if (!response.success) {
            console.log('├─ [API] Update failed, creating new preferences...');
            const createResponse = await apiClient.createPreferences(prefsData);
            console.log('└─ [API] Create preferences response:', {
                success: createResponse.success,
                error: createResponse.error,
            });
        } else {
            console.log('└─ [API] Successfully saved buffer settings');
        }
    }, [buffers]);

    const savePersonalizationData = useCallback(async () => {
        const prefsData = {
            displayName: fields.find((f) => f.id === 'displayName')?.value || '',
            nickname: fields.find((f) => f.id === 'nickname')?.value || '',
            signature: fields.find((f) => f.id === 'signature')?.value || '',
        };

        console.log('┌─ [API] Saving personalization data...');
        const response = await apiClient.updatePreferences(prefsData);
        console.log('├─ [API] Update preferences response:', {
            success: response.success,
            error: response.error,
        });
        if (!response.success) {
            console.log('├─ [API] Update failed, creating new preferences...');
            const createResponse = await apiClient.createPreferences(prefsData);
            console.log('└─ [API] Create preferences response:', {
                success: createResponse.success,
                error: createResponse.error,
            });
        } else {
            console.log('└─ [API] Successfully saved personalization data');
        }
    }, [fields]);

    const saveScheduleData = useCallback(async () => {
        // Clear existing availability first
        console.log('┌─ [API] Saving schedule data...');
        console.log('├─ [API] Getting existing availability...');
        const existingAvailability = await apiClient.getAvailability();
        console.log('├─ [API] Existing availability response:', {
            success: existingAvailability.success,
            dataLength: Array.isArray(existingAvailability.data)
                ? existingAvailability.data.length
                : 0,
        });
        if (existingAvailability.success && existingAvailability.data) {
            const existing = existingAvailability.data as Array<{ id: number }>;
            console.log('├─ [API] Deleting', existing.length, 'existing availability records...');
            for (const avail of existing) {
                await apiClient.deleteAvailability(avail.id);
            }
            console.log('├─ [API] Deleted existing availability records');
        }

        // Convert schedule to availability format using utility function
        console.log('├─ [API] Converting schedule to availability format...');
        const { convertScheduleToAvailability } = await import('@/lib/availability-utils');
        const availabilityData = convertScheduleToAvailability(schedule);

        // Create new availability records
        console.log('├─ [API] Creating new availability records...');
        let createdCount = 0;
        for (const avail of availabilityData) {
            await apiClient.createAvailability({
                days: avail.days,
                startTime: avail.startTime,
                endTime: avail.endTime,
            });
            createdCount++;
        }
        console.log('└─ [API] Created', createdCount, 'new availability records');
    }, [schedule]);

    const finalizeOnboarding = useCallback(async () => {
        // Generate preferences document and mark onboarding as complete
        console.log('┌─ [API] Finalizing onboarding...');

        // Generate the preferences document
        console.log('├─ [API] Generating preferences document...');
        const documentResponse = await apiClient.generatePreferencesDocument();
        console.log('├─ [API] Generate document response:', {
            success: documentResponse.success,
            error: documentResponse.error,
        });

        if (!documentResponse.success) {
            console.log('└─ [API] Failed to generate preferences document');
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
                // Schedule step - save availability
                await saveScheduleData();
                break;
            case 5:
                // Completion step - finalize onboarding
                await finalizeOnboarding();
                break;
        }
    }, [step, saveBufferSettings, savePersonalizationData, saveScheduleData, finalizeOnboarding]);

    // Handle next step for the onboarding flow
    const handleNext = useCallback(async () => {
        setLoading(true);

        try {
            // Save current step data before proceeding
            await saveCurrentStepData();

            if (step < totalSteps) {
                setStep(step + 1);
            } else {
                // Navigate to dashboard on last step
                window.location.href = '/dashboard';
            }
            setLoading(false);
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : 'Failed to save step data';
            console.error('Failed to proceed to next step:', errorMessage);
            showToast.error(errorMessage);
            setError(errorMessage);
            setLoading(false);
        }
    }, [step, saveCurrentStepData]);

    // Handle adding calendar during onboarding
    const handleAddCalendar = async () => {
        try {
            console.log('[FRONTEND] Starting Google account linking process...');
            setError(null);

            console.log('[FRONTEND] Calling authClient.linkSocial...');
            const response = await authClient.linkSocial({
                provider: 'google',
                callbackURL: '/get-started?action=linked&step=1',
            });

            console.log('[FRONTEND] linkSocial response:', response);

            if (response.error) {
                console.error('[FRONTEND] Error in linkSocial response:', response.error);
                throw new Error(response.error.message || 'Failed to link account');
            }

            if (response.data?.url) {
                console.log('[FRONTEND] Redirecting to OAuth URL:', response.data.url);
                window.location.href = response.data.url;
            } else {
                console.warn('[FRONTEND] No redirect URL received from linkSocial');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to link account';
            console.error('[FRONTEND] Error linking additional Google account:', error);
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
                return <ScheduleStep schedule={schedule} onUpdateSchedule={setSchedule} />;
            case 5:
                return <CompletionStep />;
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
                {/* Add right side content */}
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
