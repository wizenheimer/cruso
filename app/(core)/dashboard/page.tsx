'use client';

import { useState, useEffect } from 'react';
import {
    Sidebar,
    PreferencesView,
    CalendarSection,
    InboxSection,
    CalendarAccount,
    EmailAccount,
    Preferences,
} from '@/components/dashboard';

export default function DashboardPage() {
    const [activeView, setActiveView] = useState<'preferences' | 'accounts'>('accounts');

    const [calendarAccounts, setCalendarAccounts] = useState<CalendarAccount[]>([
        {
            id: '1',
            email: 'byrdhq.dev@gmail.com',
            provider: 'Google Calendar',
            isPrimary: true,
            calendars: [
                { name: 'Primary', enabled: true },
                { name: 'Holidays in the United States', enabled: true },
            ],
        },
        {
            id: '2',
            email: 'xnayankumar@gmail.com',
            provider: 'Google Calendar',
            isPrimary: false,
            calendars: [
                { name: 'Primary', enabled: true },
                { name: 'Holidays in the United States', enabled: true },
            ],
        },
        {
            id: '3',
            email: 'john.doe@gmail.com',
            provider: 'Google Calendar',
            isPrimary: false,
            calendars: [
                { name: 'Primary', enabled: true },
                { name: 'Holidays in the United States', enabled: false },
            ],
        },
        {
            id: '4',
            email: 'jane.smith@gmail.com',
            provider: 'Google Calendar',
            isPrimary: false,
            calendars: [
                { name: 'Primary', enabled: true },
                { name: 'Holidays in the United States', enabled: true },
            ],
        },
    ]);

    const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([
        {
            id: '1',
            email: 'byrdhq.dev@gmail.com',
            provider: 'Gmail',
            isPrimary: true,
        },
        {
            id: '2',
            email: 'xnayankumar@gmail.com',
            provider: 'Gmail',
            isPrimary: false,
        },
        {
            id: '3',
            email: 'john.doe@gmail.com',
            provider: 'Gmail',
            isPrimary: false,
        },
        {
            id: '4',
            email: 'jane.smith@gmail.com',
            provider: 'Gmail',
            isPrimary: false,
        },
    ]);

    const [preferences, setPreferences] = useState<Preferences>({
        message: '',
    });
    const [originalPreferences, setOriginalPreferences] = useState<Preferences>({
        message: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Check for unsaved changes
    useEffect(() => {
        const hasChanges = preferences.message !== originalPreferences.message;
        setHasUnsavedChanges(hasChanges);
    }, [preferences.message, originalPreferences.message]);

    const handleMakePrimaryCalendar = (accountId: string) => {
        setCalendarAccounts((accounts) =>
            accounts.map((account) => ({
                ...account,
                isPrimary: account.id === accountId,
            })),
        );
    };

    const handleRemoveCalendar = (accountId: string) => {
        setCalendarAccounts((accounts) => accounts.filter((account) => account.id !== accountId));
    };

    const handleMakePrimaryEmail = (accountId: string) => {
        setEmailAccounts((accounts) =>
            accounts.map((account) => ({
                ...account,
                isPrimary: account.id === accountId,
            })),
        );
    };

    const handleRemoveEmail = (accountId: string) => {
        setEmailAccounts((accounts) => accounts.filter((account) => account.id !== accountId));
    };

    const handleAddEmail = (email: string) => {
        const newAccount: EmailAccount = {
            id: Date.now().toString(),
            email,
            provider: 'Gmail',
            isPrimary: false,
        };
        setEmailAccounts((accounts) => [...accounts, newAccount]);
    };

    const handleSavePreferences = async () => {
        setIsSaving(true);
        // Mock saving delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setOriginalPreferences({ ...preferences });
        setHasUnsavedChanges(false);
        setIsSaving(false);
    };

    const handleResetPreferences = () => {
        setPreferences({ ...originalPreferences });
        setHasUnsavedChanges(false);
    };

    const handleCalendarToggle = (accountId: string, calendarName: string) => {
        setCalendarAccounts((accounts) =>
            accounts.map((account) =>
                account.id === accountId
                    ? {
                          ...account,
                          calendars: account.calendars.map((cal) =>
                              cal.name === calendarName ? { ...cal, enabled: !cal.enabled } : cal,
                          ),
                      }
                    : account,
            ),
        );
    };

    return (
        <div className="min-h-screen bg-white flex">
            <div className="flex max-w-7xl mx-auto w-full">
                <Sidebar activeView={activeView} onViewChange={setActiveView} />

                {/* Main Content */}
                <div className="flex-1 max-w-6xl">
                    {/* Header */}
                    <div className="bg-white px-6 py-6">
                        {/* Header content can be added here if needed */}
                    </div>

                    {/* Content */}
                    <div className="px-6 pb-8 max-w-5xl">
                        {activeView === 'accounts' && (
                            <div className="space-y-12 mt-6">
                                <CalendarSection
                                    calendarAccounts={calendarAccounts}
                                    onMakePrimary={handleMakePrimaryCalendar}
                                    onRemove={handleRemoveCalendar}
                                    onCalendarToggle={handleCalendarToggle}
                                />
                                <InboxSection
                                    emailAccounts={emailAccounts}
                                    onMakePrimary={handleMakePrimaryEmail}
                                    onRemove={handleRemoveEmail}
                                    onAddEmail={handleAddEmail}
                                />
                            </div>
                        )}

                        {activeView === 'preferences' && (
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
        </div>
    );
}
