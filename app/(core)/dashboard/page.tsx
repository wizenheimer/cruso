'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
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
        id: 0,
        userId: '',
        document: '',
        displayName: '',
        nickname: '',
        signature: '',
        timezone: 'America/New_York',
        minNoticeMinutes: 120,
        maxDaysAhead: 60,
        defaultMeetingDurationMinutes: 30,
        virtualBufferMinutes: 0,
        inPersonBufferMinutes: 15,
        backToBackBufferMinutes: 0,
        flightBufferMinutes: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    const [originalPreferences, setOriginalPreferences] = useState<Preferences>({
        id: 0,
        userId: '',
        document: '',
        displayName: '',
        nickname: '',
        signature: '',
        timezone: 'America/New_York',
        minNoticeMinutes: 120,
        maxDaysAhead: 60,
        defaultMeetingDurationMinutes: 30,
        virtualBufferMinutes: 0,
        inPersonBufferMinutes: 15,
        backToBackBufferMinutes: 0,
        flightBufferMinutes: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Check for unsaved changes
    useEffect(() => {
        const hasChanges = preferences.document !== originalPreferences.document;
        setHasUnsavedChanges(hasChanges);
    }, [preferences.document, originalPreferences.document]);

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

    const getViewLabel = (view: 'preferences' | 'accounts') => {
        return view === 'preferences' ? 'Preferences' : 'Accounts';
    };

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
    );
}
