'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';
import { PREFERENCES_DEFAULTS } from '@/lib/preferences-constants';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sidebar,
    MobileAvatar,
    PreferencesView,
    CalendarSection,
    InboxSection,
    CalendarAccount,
    EmailAccount,
    Preferences,
    PreferencesWithPrimaries,
} from '@/components/dashboard';

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

interface ApiEmailAccount {
    id: string;
    email: string;
    isPrimary: boolean;
}

export default function DashboardPage() {
    const [activeView, setActiveView] = useState<'preferences' | 'accounts'>('accounts');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [calendarAccounts, setCalendarAccounts] = useState<CalendarAccount[]>([]);
    const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);

    const [preferences, setPreferences] = useState<Preferences | null>(null);
    const [originalPreferences, setOriginalPreferences] = useState<Preferences | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const autoSyncPostOAuth = useCallback(async () => {
        try {
            console.log('[FRONTEND] Running automatic post-OAuth calendar sync...');

            const response = await fetch('/api/auth/post-oauth-sync', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            console.log('[FRONTEND] Post-OAuth sync response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('[FRONTEND] Auto-sync result:', result);

                if (result.calendarsSynced > 0) {
                    console.log('[FRONTEND] Calendars were synced, refreshing dashboard data...');
                    // Refresh the data to show the new calendars
                    await loadDashboardData();
                } else {
                    console.log('[FRONTEND] No new calendars were synced');
                }
            } else {
                console.error('[FRONTEND] Auto-sync failed:', response.statusText);
            }
        } catch (error) {
            console.error('[FRONTEND] Error in auto-sync:', error);
            // Don't show error to user for auto-sync, it's a background operation
        }
    }, []);

    // Load initial data
    useEffect(() => {
        loadDashboardData();
    }, []);

    // Handle OAuth callback
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');

        if (action === 'linked') {
            // Auto-sync calendars after OAuth linking
            autoSyncPostOAuth();

            // Clean up URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [autoSyncPostOAuth]);

    // Check for unsaved changes
    useEffect(() => {
        if (preferences && originalPreferences) {
            const hasChanges = preferences.document !== originalPreferences.document;
            setHasUnsavedChanges(hasChanges);
        }
    }, [preferences?.document, originalPreferences?.document, preferences, originalPreferences]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load calendar accounts
            console.log('┌─ [API] Loading calendar accounts...');
            const calendarResponse = await apiClient.getCalendarAccounts();
            console.log('├─ [API] Calendar accounts response:', {
                success: calendarResponse.success,
                dataLength: Array.isArray(calendarResponse.data) ? calendarResponse.data.length : 0,
                error: calendarResponse.error,
            });
            if (calendarResponse.success && calendarResponse.data) {
                const apiData = calendarResponse.data as ApiCalendarAccount[];
                const transformedCalendarAccounts = apiData.map((account) => ({
                    id: account.accountId,
                    email: account.email,
                    provider: 'Google Calendar' as const,
                    isPrimary: account.calendars.some((cal) => cal.isPrimary),
                    calendars: account.calendars.map((cal) => ({
                        id: cal.id,
                        name: cal.name,
                        enabled: cal.includeInAvailability,
                    })),
                }));
                setCalendarAccounts(transformedCalendarAccounts);
                console.log(
                    '└─ [API] Successfully loaded',
                    transformedCalendarAccounts.length,
                    'calendar accounts',
                );
            } else {
                console.log('└─ [API] Failed to load calendar accounts');
            }

            // Load email accounts
            console.log('┌─ [API] Loading email accounts...');
            const emailResponse = await apiClient.getUserEmails();
            console.log('├─ [API] Email accounts response:', {
                success: emailResponse.success,
                dataLength: Array.isArray(emailResponse.data) ? emailResponse.data.length : 0,
                error: emailResponse.error,
            });
            if (emailResponse.success && emailResponse.data) {
                const apiData = emailResponse.data as ApiEmailAccount[];
                const transformedEmailAccounts = apiData.map((email) => ({
                    id: email.id,
                    email: email.email,
                    provider: 'Gmail' as const,
                    isPrimary: email.isPrimary,
                }));
                setEmailAccounts(transformedEmailAccounts);
                console.log(
                    '└─ [API] Successfully loaded',
                    transformedEmailAccounts.length,
                    'email accounts',
                );
            } else {
                console.log('└─ [API] Failed to load email accounts');
            }

            // Load preferences
            console.log('┌─ [API] Loading preferences...');
            const preferencesResponse = await apiClient.getPreferences();
            console.log('├─ [API] Preferences response:', {
                success: preferencesResponse.success,
                hasData: !!preferencesResponse.data,
                error: preferencesResponse.error,
            });
            if (preferencesResponse.success && preferencesResponse.data) {
                const prefsData = preferencesResponse.data as PreferencesWithPrimaries;
                setPreferences(prefsData.preferences);
                setOriginalPreferences(prefsData.preferences);
                console.log('└─ [API] Successfully loaded preferences');
            } else {
                // Create default preferences if none exist
                const defaultPreferences: Preferences = {
                    id: 0,
                    userId: '',
                    document: PREFERENCES_DEFAULTS.DOCUMENT,
                    displayName: PREFERENCES_DEFAULTS.DISPLAY_NAME,
                    nickname: PREFERENCES_DEFAULTS.NICKNAME,
                    signature: PREFERENCES_DEFAULTS.SIGNATURE,
                    timezone: PREFERENCES_DEFAULTS.TIMEZONE,
                    minNoticeMinutes: PREFERENCES_DEFAULTS.MIN_NOTICE_MINUTES,
                    maxDaysAhead: PREFERENCES_DEFAULTS.MAX_DAYS_AHEAD,
                    defaultMeetingDurationMinutes:
                        PREFERENCES_DEFAULTS.DEFAULT_MEETING_DURATION_MINUTES,
                    virtualBufferMinutes: PREFERENCES_DEFAULTS.VIRTUAL_BUFFER_MINUTES,
                    inPersonBufferMinutes: PREFERENCES_DEFAULTS.IN_PERSON_BUFFER_MINUTES,
                    backToBackBufferMinutes: PREFERENCES_DEFAULTS.BACK_TO_BACK_BUFFER_MINUTES,
                    flightBufferMinutes: PREFERENCES_DEFAULTS.FLIGHT_BUFFER_MINUTES,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                setPreferences(defaultPreferences);
                setOriginalPreferences(defaultPreferences);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleMakePrimaryCalendar = async (accountId: string) => {
        try {
            console.log('┌─ [API] Making calendar primary...', { accountId });
            // For calendar accounts, we need to make all calendars of this account primary
            const response = await apiClient.updateCalendarConnection(accountId, {
                isPrimary: true,
            });
            console.log('├─ [API] Make primary response:', {
                success: response.success,
                error: response.error,
            });
            if (response.success) {
                // Update local state
                setCalendarAccounts((accounts) =>
                    accounts.map((account) => ({
                        ...account,
                        isPrimary: account.id === accountId,
                    })),
                );
                console.log('└─ [API] Successfully updated primary calendar');
            } else {
                console.log('└─ [API] Failed to update primary calendar');
                setError('Failed to update primary calendar');
            }
        } catch (error) {
            console.error('Error updating primary calendar:', error);
            setError('Failed to update primary calendar');
        }
    };

    const handleRemoveCalendar = async (accountId: string) => {
        try {
            console.log('┌─ [API] Removing calendar...', { accountId });
            const response = await apiClient.deleteCalendarAccount(accountId);
            console.log('├─ [API] Remove calendar response:', {
                success: response.success,
                error: response.error,
            });
            if (response.success) {
                // Update local state
                setCalendarAccounts((accounts) =>
                    accounts.filter((account) => account.id !== accountId),
                );
                console.log('└─ [API] Successfully removed calendar');
            } else {
                console.log('└─ [API] Failed to remove calendar');
                setError(response.error || 'Failed to remove calendar');
            }
        } catch (error) {
            console.error('Error removing calendar:', error);
            setError('Failed to remove calendar');
        }
    };

    const handleMakePrimaryEmail = async (accountId: string) => {
        try {
            console.log('┌─ [API] Making email primary...', { accountId });
            const response = await apiClient.updateUserEmail(accountId, { isPrimary: true });
            console.log('├─ [API] Make primary email response:', {
                success: response.success,
                error: response.error,
            });
            if (response.success) {
                // Update local state
                setEmailAccounts((accounts) =>
                    accounts.map((account) => ({
                        ...account,
                        isPrimary: account.id === accountId,
                    })),
                );
                console.log('└─ [API] Successfully updated primary email');
            } else {
                console.log('└─ [API] Failed to update primary email');
                setError('Failed to update primary email');
            }
        } catch (error) {
            console.error('Error updating primary email:', error);
            setError('Failed to update primary email');
        }
    };

    const handleRemoveEmail = async (accountId: string) => {
        try {
            console.log('┌─ [API] Removing email...', { accountId });
            const response = await apiClient.deleteUserEmail(accountId);
            console.log('├─ [API] Remove email response:', {
                success: response.success,
                error: response.error,
            });
            if (response.success) {
                // Update local state
                setEmailAccounts((accounts) =>
                    accounts.filter((account) => account.id !== accountId),
                );
                console.log('└─ [API] Successfully removed email');
            } else {
                console.log('└─ [API] Failed to remove email');
                setError('Failed to remove email');
            }
        } catch (error) {
            console.error('Error removing email:', error);
            setError('Failed to remove email');
        }
    };

    const handleAddEmail = async (email: string) => {
        try {
            console.log('┌─ [API] Adding email...', { email });
            const response = await apiClient.addUserEmail({ email });
            console.log('├─ [API] Add email response:', {
                success: response.success,
                error: response.error,
            });
            if (response.success && response.data) {
                const apiData = response.data as ApiEmailAccount;
                const newAccount: EmailAccount = {
                    id: apiData.id,
                    email: apiData.email,
                    provider: 'Gmail',
                    isPrimary: apiData.isPrimary,
                };
                setEmailAccounts((accounts) => [...accounts, newAccount]);
                console.log('└─ [API] Successfully added email');
            } else {
                console.log('└─ [API] Failed to add email');
                setError('Failed to add email');
            }
        } catch (error) {
            console.error('Error adding email:', error);
            setError('Failed to add email');
        }
    };

    const handleSavePreferences = async () => {
        if (!preferences) return;

        setIsSaving(true);
        try {
            let response;
            // Convert Preferences to a plain object for API
            const prefsData = {
                document: preferences.document,
                displayName: preferences.displayName,
                nickname: preferences.nickname,
                signature: preferences.signature,
                timezone: preferences.timezone,
                minNoticeMinutes: preferences.minNoticeMinutes,
                maxDaysAhead: preferences.maxDaysAhead,
                defaultMeetingDurationMinutes: preferences.defaultMeetingDurationMinutes,
                virtualBufferMinutes: preferences.virtualBufferMinutes,
                inPersonBufferMinutes: preferences.inPersonBufferMinutes,
                backToBackBufferMinutes: preferences.backToBackBufferMinutes,
                flightBufferMinutes: preferences.flightBufferMinutes,
                isActive: preferences.isActive,
            };

            console.log('┌─ [API] Saving preferences...', { isCreate: preferences.id === 0 });
            if (preferences.id === 0) {
                // Create new preferences
                response = await apiClient.createPreferences(prefsData);
            } else {
                // Update existing preferences
                response = await apiClient.updatePreferences(prefsData);
            }
            console.log('├─ [API] Save preferences response:', {
                success: response.success,
                error: response.error,
            });

            if (response.success && response.data) {
                const updatedPrefs = response.data as Preferences;
                setPreferences(updatedPrefs);
                setOriginalPreferences(updatedPrefs);
                setHasUnsavedChanges(false);
                console.log('└─ [API] Successfully saved preferences');
            } else {
                console.log('└─ [API] Failed to save preferences');
                setError('Failed to save preferences');
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
            setError('Failed to save preferences');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPreferences = () => {
        if (originalPreferences) {
            setPreferences({ ...originalPreferences });
            setHasUnsavedChanges(false);
        }
    };

    const handleCalendarToggle = async (accountId: string, calendarName: string) => {
        try {
            console.log('┌─ [API] Toggling calendar...', { accountId, calendarName });
            // Find the calendar connection to toggle
            const account = calendarAccounts.find((acc) => acc.id === accountId);
            const calendar = account?.calendars.find((cal) => cal.name === calendarName);

            console.log('├─ [DEBUG] Account found:', account);
            console.log('├─ [DEBUG] Calendar found:', calendar);
            console.log('├─ [DEBUG] Calendar ID:', calendar?.id);
            console.log('├─ [DEBUG] All calendars in account:', account?.calendars);

            if (account && calendar && calendar.id) {
                // Update the calendar connection via API using the calendar connection ID
                const response = await apiClient.updateCalendarConnection(calendar.id, {
                    includeInAvailability: !calendar.enabled,
                });
                console.log('├─ [API] Toggle calendar response:', {
                    success: response.success,
                    error: response.error,
                    newState: !calendar.enabled,
                });

                if (response.success) {
                    // Update local state
                    setCalendarAccounts((accounts) =>
                        accounts.map((acc) =>
                            acc.id === accountId
                                ? {
                                      ...acc,
                                      calendars: acc.calendars.map((cal) =>
                                          cal.name === calendarName
                                              ? { ...cal, enabled: !cal.enabled }
                                              : cal,
                                      ),
                                  }
                                : acc,
                        ),
                    );
                    console.log('└─ [API] Successfully toggled calendar');
                } else {
                    console.log('└─ [API] Failed to toggle calendar');
                    setError('Failed to update calendar settings');
                }
            }
        } catch (error) {
            console.error('Error updating calendar:', error);
            setError('Failed to update calendar settings');
        }
    };

    const handleAddCalendar = async () => {
        try {
            console.log('[FRONTEND] Starting Google account linking process...');
            setError(null);

            console.log('[FRONTEND] Calling authClient.linkSocial...');
            const response = await authClient.linkSocial({
                provider: 'google',
                callbackURL: '/dashboard?action=linked',
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
            console.error('[FRONTEND] Error linking additional Google account:', error);
            setError(error instanceof Error ? error.message : 'Failed to link account');
        }
    };

    const getViewLabel = (view: 'preferences' | 'accounts') => {
        return view === 'preferences' ? 'Preferences' : 'Accounts';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={loadDashboardData}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar activeView={activeView} onViewChange={setActiveView} />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <div className="md:hidden bg-white px-4 py-3 flex items-center justify-between">
                    <h1 className="text-lg font-semibold text-gray-900">Cruso</h1>

                    <div className="flex items-center space-x-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-100">
                                    <span>{getViewLabel(activeView)}</span>
                                    <ChevronDown className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="bg-white border border-gray-200 shadow-lg w-40"
                            >
                                <DropdownMenuItem
                                    onClick={() => setActiveView('accounts')}
                                    className={`cursor-pointer ${
                                        activeView === 'accounts'
                                            ? 'bg-gray-50 text-gray-900'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Accounts
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setActiveView('preferences')}
                                    className={`cursor-pointer ${
                                        activeView === 'preferences'
                                            ? 'bg-gray-50 text-gray-900'
                                            : 'text-gray-600'
                                    }`}
                                >
                                    Preferences
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <MobileAvatar />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 px-4 md:px-6 pb-8 max-w-6xl mx-auto w-full">
                    {activeView === 'accounts' && (
                        <div className="space-y-8 md:space-y-12 mt-4 md:mt-6">
                            <CalendarSection
                                calendarAccounts={calendarAccounts}
                                onMakePrimary={handleMakePrimaryCalendar}
                                onRemove={handleRemoveCalendar}
                                onCalendarToggle={handleCalendarToggle}
                                onAddCalendar={handleAddCalendar}
                            />
                            <InboxSection
                                emailAccounts={emailAccounts}
                                onMakePrimary={handleMakePrimaryEmail}
                                onRemove={handleRemoveEmail}
                                onAddEmail={handleAddEmail}
                            />
                        </div>
                    )}

                    {activeView === 'preferences' && preferences && (
                        <PreferencesView
                            preferences={preferences}
                            isSaving={isSaving}
                            hasUnsavedChanges={hasUnsavedChanges}
                            onPreferencesChange={setPreferences}
                            onSave={handleSavePreferences}
                            onReset={handleResetPreferences}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
