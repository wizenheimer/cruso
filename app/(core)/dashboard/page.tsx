'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { apiClient } from '@/client/api';
import { authClient } from '@/client/auth';
import { showToast } from '@/lib/toast';
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
    id: number;
    email: string;
    isPrimary: boolean;
}

export default function DashboardPage() {
    const [activeView, setActiveView] = useState<'preferences' | 'accounts'>('accounts');
    const [loading, setLoading] = useState(true);

    const [calendarAccounts, setCalendarAccounts] = useState<CalendarAccount[]>([]);
    const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);

    const [preferences, setPreferences] = useState<Preferences | null>(null);
    const [originalPreferences, setOriginalPreferences] = useState<Preferences | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Load initial data
    useEffect(() => {
        loadDashboardData();
    }, []);

    // Check for unsaved changes
    useEffect(() => {
        if (preferences && originalPreferences) {
            const hasChanges = preferences.document !== originalPreferences.document;
            setHasUnsavedChanges(hasChanges);
        }
    }, [preferences?.document, originalPreferences?.document, preferences, originalPreferences]);

    /**
     * Load all dashboard data including calendar accounts, email accounts, and user preferences
     */
    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load calendar accounts
            console.log('┌─ [API] Loading calendar accounts...');
            const calendarResponse = await apiClient.getCalendarAccounts();
            console.log('├─ [API] Calendar accounts response:', {
                success: calendarResponse.success,
                dataLength: Array.isArray(calendarResponse.data) ? calendarResponse.data.length : 0,
                error: calendarResponse.error,
            });
            if (calendarResponse.success && calendarResponse.data) {
                const calendarAccountsData = calendarResponse.data as ApiCalendarAccount[];
                setCalendarAccounts(
                    calendarAccountsData.map((calendarAccount) => ({
                        id: calendarAccount.accountId,
                        email: calendarAccount.email,
                        provider: 'Google Calendar' as const,
                        isPrimary: false, // Will be set after preferences are loaded
                        calendars: calendarAccount.calendars.map((calendar) => ({
                            id: calendar.id,
                            name: calendar.name,
                            enabled: calendar.includeInAvailability,
                        })),
                    })),
                );
                console.log(
                    '└─ [API] Successfully loaded',
                    calendarAccountsData.length,
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
                const emailAccountsData = emailResponse.data as ApiEmailAccount[];
                setEmailAccounts(
                    emailAccountsData.map((emailAccount) => ({
                        id: emailAccount.id,
                        email: emailAccount.email,
                        provider: 'Gmail' as const,
                        isPrimary: emailAccount.isPrimary, // Use the primary status from API
                    })),
                );
                console.log(
                    '└─ [API] Successfully loaded',
                    emailAccountsData.length,
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
                const userPreferencesData = preferencesResponse.data as PreferencesWithPrimaries;
                setPreferences(userPreferencesData.preferences);
                setOriginalPreferences(userPreferencesData.preferences);

                // Update calendar primary status based on preferences
                if (userPreferencesData.preferences.primaryAccountId) {
                    setCalendarAccounts((calendarAccounts) =>
                        calendarAccounts.map((calendarAccount) => ({
                            ...calendarAccount,
                            isPrimary:
                                calendarAccount.id ===
                                userPreferencesData.preferences.primaryAccountId,
                        })),
                    );
                }

                console.log('└─ [API] Successfully loaded preferences');
            } else {
                console.log('└─ [API] No preferences found');
            }
        } catch (dashboardError) {
            console.error('Error loading dashboard data:', dashboardError);
            showToast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Set a calendar account as the primary calendar for the user
     * @param primaryAccountId - The account ID to set as primary
     */
    const handleMakePrimaryCalendar = async (primaryAccountId: string) => {
        try {
            console.log('┌─ [API] Making calendar primary...', { accountId: primaryAccountId });

            // Update preferences to set this account as primary
            const updatePrimaryResponse = await apiClient.updatePrimaryAccount(primaryAccountId);
            console.log('├─ [API] Update primary account response:', {
                success: updatePrimaryResponse.success,
                error: updatePrimaryResponse.error,
            });
            if (updatePrimaryResponse.success) {
                // Update local preferences state
                setPreferences((previousPreferences) =>
                    previousPreferences ? { ...previousPreferences, primaryAccountId } : null,
                );
                setOriginalPreferences((previousOriginalPreferences) =>
                    previousOriginalPreferences
                        ? { ...previousOriginalPreferences, primaryAccountId }
                        : null,
                );

                // Update local calendar accounts state
                setCalendarAccounts((currentCalendarAccounts) =>
                    currentCalendarAccounts.map((calendarAccount) => ({
                        ...calendarAccount,
                        isPrimary: calendarAccount.id === primaryAccountId,
                    })),
                );
                console.log('└─ [API] Successfully updated primary calendar');
            } else {
                console.log('└─ [API] Failed to update primary calendar');
                showToast.error('Failed to update primary calendar');
            }
        } catch (primaryCalendarError) {
            console.error('Error updating primary calendar:', primaryCalendarError);
            showToast.error('Failed to update primary calendar');
        }
    };

    /**
     * Remove a calendar account and all associated calendars
     * @param accountIdToRemove - The account ID to remove
     */
    const handleRemoveCalendar = async (accountIdToRemove: string) => {
        try {
            console.log('┌─ [API] Removing calendar...', { accountId: accountIdToRemove });
            const deleteCalendarResponse = await apiClient.deleteCalendarAccount(accountIdToRemove);
            console.log('├─ [API] Remove calendar response:', {
                success: deleteCalendarResponse.success,
                error: deleteCalendarResponse.error,
            });
            if (deleteCalendarResponse.success) {
                // Update local state
                setCalendarAccounts((currentCalendarAccounts) =>
                    currentCalendarAccounts.filter(
                        (calendarAccount) => calendarAccount.id !== accountIdToRemove,
                    ),
                );
                console.log('└─ [API] Successfully removed calendar');
            } else {
                console.log('└─ [API] Failed to remove calendar');
                const errorMessage = deleteCalendarResponse.error || 'Failed to remove calendar';
                showToast.error(errorMessage);
            }
        } catch (removeCalendarError) {
            console.error('Error removing calendar:', removeCalendarError);
            showToast.error('Failed to remove calendar');
        }
    };

    /**
     * Set an email account as the primary email for the user
     * @param primaryEmailId - The email ID to set as primary
     */
    const handleMakePrimaryEmail = async (primaryEmailId: number) => {
        try {
            console.log('┌─ [API] Making email primary...', { emailId: primaryEmailId });

            // Update preferences to set this email as primary
            const updatePrimaryEmailResponse = await apiClient.updatePrimaryEmail(primaryEmailId);
            console.log('├─ [API] Update primary email response:', {
                success: updatePrimaryEmailResponse.success,
                error: updatePrimaryEmailResponse.error,
            });
            if (updatePrimaryEmailResponse.success) {
                // Update local preferences state
                setPreferences((previousPreferences) =>
                    previousPreferences
                        ? { ...previousPreferences, primaryUserEmailId: primaryEmailId }
                        : null,
                );
                setOriginalPreferences((previousOriginalPreferences) =>
                    previousOriginalPreferences
                        ? { ...previousOriginalPreferences, primaryUserEmailId: primaryEmailId }
                        : null,
                );

                // Update local email accounts state
                setEmailAccounts((currentEmailAccounts) =>
                    currentEmailAccounts.map((emailAccount) => ({
                        ...emailAccount,
                        isPrimary: emailAccount.id === primaryEmailId,
                    })),
                );
                console.log('└─ [API] Successfully updated primary email');
            } else {
                console.log('└─ [API] Failed to update primary email');
                showToast.error('Failed to update primary email');
            }
        } catch (primaryEmailError) {
            console.error('Error updating primary email:', primaryEmailError);
            showToast.error('Failed to update primary email');
        }
    };

    /**
     * Remove an email account from the user's account
     * @param emailIdToRemove - The email ID to remove
     */
    const handleRemoveEmail = async (emailIdToRemove: number) => {
        try {
            console.log('┌─ [API] Removing email...', { emailId: emailIdToRemove });
            const deleteEmailResponse = await apiClient.deleteUserEmail(emailIdToRemove);
            console.log('├─ [API] Remove email response:', {
                success: deleteEmailResponse.success,
                error: deleteEmailResponse.error,
            });
            if (deleteEmailResponse.success) {
                // Update local state
                setEmailAccounts((currentEmailAccounts) =>
                    currentEmailAccounts.filter(
                        (emailAccount) => emailAccount.id !== emailIdToRemove,
                    ),
                );
                console.log('└─ [API] Successfully removed email');
            } else {
                console.log('└─ [API] Failed to remove email');
                showToast.error('Failed to remove email');
            }
        } catch (removeEmailError) {
            console.error('Error removing email:', removeEmailError);
            showToast.error('Failed to remove email');
        }
    };

    /**
     * Add a new email address to the user's account
     * @param newEmailAddress - The email address to add
     */
    const handleAddEmail = async (newEmailAddress: string) => {
        try {
            console.log('┌─ [API] Adding email...', { email: newEmailAddress });
            const addEmailResponse = await apiClient.addUserEmail({ email: newEmailAddress });
            console.log('├─ [API] Add email response:', {
                success: addEmailResponse.success,
                error: addEmailResponse.error,
            });
            if (addEmailResponse.success && addEmailResponse.data) {
                const newEmailData = addEmailResponse.data as ApiEmailAccount;
                const newEmailAccount: EmailAccount = {
                    id: newEmailData.id,
                    email: newEmailData.email,
                    provider: 'Gmail',
                    isPrimary: newEmailData.isPrimary,
                };
                setEmailAccounts((currentEmailAccounts) => [
                    ...currentEmailAccounts,
                    newEmailAccount,
                ]);

                // If this email is primary, update preferences
                if (newEmailData.isPrimary && preferences) {
                    setPreferences((previousPreferences) =>
                        previousPreferences
                            ? { ...previousPreferences, primaryUserEmailId: newEmailData.id }
                            : null,
                    );
                    setOriginalPreferences((previousOriginalPreferences) =>
                        previousOriginalPreferences
                            ? {
                                  ...previousOriginalPreferences,
                                  primaryUserEmailId: newEmailData.id,
                              }
                            : null,
                    );
                }

                console.log('└─ [API] Successfully added email');
            } else {
                console.log('└─ [API] Failed to add email');
                showToast.error('Failed to add email');
            }
        } catch (addEmailError) {
            console.error('Error adding email:', addEmailError);
            showToast.error('Failed to add email');
        }
    };

    /**
     * Save the current user preferences to the server
     * Creates new preferences if they don't exist, otherwise updates existing ones
     */
    const handleSavePreferences = async () => {
        if (!preferences) return;

        setIsSaving(true);
        try {
            let savePreferencesResponse;
            // Convert Preferences to a plain object for API
            const preferencesPayload = {
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
                savePreferencesResponse = await apiClient.createPreferences(preferencesPayload);
            } else {
                // Update existing preferences
                savePreferencesResponse = await apiClient.updatePreferences(preferencesPayload);
            }
            console.log('├─ [API] Save preferences response:', {
                success: savePreferencesResponse.success,
                error: savePreferencesResponse.error,
            });

            if (savePreferencesResponse.success && savePreferencesResponse.data) {
                const savedPreferences = savePreferencesResponse.data as Preferences;
                setPreferences(savedPreferences);
                setOriginalPreferences(savedPreferences);
                setHasUnsavedChanges(false);
                console.log('└─ [API] Successfully saved preferences');
            } else {
                console.log('└─ [API] Failed to save preferences');
                showToast.error('Failed to save preferences');
            }
        } catch (savePreferencesError) {
            console.error('Error saving preferences:', savePreferencesError);
            showToast.error('Failed to save preferences');
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Reset preferences to their original state, discarding any unsaved changes
     */
    const handleResetPreferences = () => {
        if (originalPreferences) {
            setPreferences({ ...originalPreferences });
            setHasUnsavedChanges(false);
        }
    };

    /**
     * Toggle the availability inclusion status of a specific calendar
     * @param targetAccountId - The account ID containing the calendar
     * @param targetCalendarName - The name of the calendar to toggle
     */
    const handleCalendarToggle = async (targetAccountId: string, targetCalendarName: string) => {
        try {
            console.log('┌─ [API] Toggling calendar...', {
                accountId: targetAccountId,
                calendarName: targetCalendarName,
            });
            // Find the calendar connection to toggle
            const targetAccount = calendarAccounts.find(
                (calendarAccount) => calendarAccount.id === targetAccountId,
            );
            const targetCalendar = targetAccount?.calendars.find(
                (calendar) => calendar.name === targetCalendarName,
            );

            console.log('├─ [DEBUG] Account found:', targetAccount);
            console.log('├─ [DEBUG] Calendar found:', targetCalendar);
            console.log('├─ [DEBUG] Calendar ID:', targetCalendar?.id);
            console.log('├─ [DEBUG] All calendars in account:', targetAccount?.calendars);

            if (targetAccount && targetCalendar && targetCalendar.id) {
                // Update the calendar connection via API using the calendar connection ID
                const toggleCalendarResponse = await apiClient.updateCalendarConnection(
                    targetCalendar.id,
                    {
                        includeInAvailability: !targetCalendar.enabled,
                    },
                );
                console.log('├─ [API] Toggle calendar response:', {
                    success: toggleCalendarResponse.success,
                    error: toggleCalendarResponse.error,
                    newState: !targetCalendar.enabled,
                });

                if (toggleCalendarResponse.success) {
                    // Update local state
                    setCalendarAccounts((currentCalendarAccounts) =>
                        currentCalendarAccounts.map((calendarAccount) =>
                            calendarAccount.id === targetAccountId
                                ? {
                                      ...calendarAccount,
                                      calendars: calendarAccount.calendars.map((calendar) =>
                                          calendar.name === targetCalendarName
                                              ? { ...calendar, enabled: !calendar.enabled }
                                              : calendar,
                                      ),
                                  }
                                : calendarAccount,
                        ),
                    );
                    console.log('└─ [API] Successfully toggled calendar');
                } else {
                    console.log('└─ [API] Failed to toggle calendar');
                    showToast.error('Failed to update calendar settings');
                }
            }
        } catch (calendarToggleError) {
            console.error('Error updating calendar:', calendarToggleError);
            showToast.error('Failed to update calendar settings');
        }
    };

    /**
     * Initiate the process to add a new Google calendar account
     * Redirects user to Google OAuth flow for account linking
     */
    const handleAddCalendar = async () => {
        try {
            console.log('[FRONTEND] Starting Google account linking process...');

            console.log('[FRONTEND] Calling authClient.linkSocial...');
            const linkSocialResponse = await authClient.linkSocial({
                provider: 'google',
                callbackURL: '/dashboard?action=linked',
                fetchOptions: {
                    onError: (error) => {
                        console.error('Error linking Google account:', error);
                        showToast.error('Failed to link Google account. Please try again.');
                    },
                },
            });

            console.log('[FRONTEND] linkSocial response:', linkSocialResponse);

            if (linkSocialResponse.error) {
                console.error('[FRONTEND] Error in linkSocial response:', linkSocialResponse.error);
                throw new Error(linkSocialResponse.error.message || 'Failed to link account');
            }

            if (linkSocialResponse.data?.url) {
                console.log('[FRONTEND] Redirecting to OAuth URL:', linkSocialResponse.data.url);
                window.location.href = linkSocialResponse.data.url;
            } else {
                console.warn('[FRONTEND] No redirect URL received from linkSocial');
            }
        } catch (addCalendarError) {
            const errorMessage =
                addCalendarError instanceof Error
                    ? addCalendarError.message
                    : 'Failed to link account';
            console.error('[FRONTEND] Error linking additional Google account:', addCalendarError);
            showToast.error(errorMessage);
        }
    };

    /**
     * Get the display label for a given view type
     * @param viewType - The view type to get the label for
     * @returns The human-readable label for the view
     */
    const getViewLabel = (viewType: 'preferences' | 'accounts') => {
        return viewType === 'preferences' ? 'Preferences' : 'Accounts';
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
