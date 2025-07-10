'use client';

import { useState, useRef, useEffect } from 'react';
import BoringAvatar from 'boring-avatars';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreVertical,
    Plus,
    Trash2,
    Star,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    LogOut,
    HelpCircle,
} from 'lucide-react';
import { GoogleCalendarIcon } from '@/components/icons/calendar-icon';
import { EmailIcon } from '@/components/icons/email-icon';

interface CalendarAccount {
    id: string;
    email: string;
    provider: string;
    isPrimary: boolean;
    calendars: {
        name: string;
        enabled: boolean;
    }[];
}

interface EmailAccount {
    id: string;
    email: string;
    provider: string;
    isPrimary: boolean;
}

export default function DashboardPage() {
    const [activeView, setActiveView] = useState<'preferences' | 'accounts'>('accounts');
    const [showAddEmail, setShowAddEmail] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [calendarPage, setCalendarPage] = useState(0);
    const [emailPage, setEmailPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(2);

    const calendarContainerRef = useRef<HTMLDivElement>(null);
    const emailContainerRef = useRef<HTMLDivElement>(null);

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

    const [preferences, setPreferences] = useState({
        message: '',
    });
    const [originalPreferences, setOriginalPreferences] = useState({
        message: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Calculate items per page based on container width
    useEffect(() => {
        const calculateItemsPerPage = () => {
            if (calendarContainerRef.current) {
                const containerWidth = calendarContainerRef.current.offsetWidth;
                const itemWidth = 320; // Approximate width of each item including gap
                const calculatedItems = Math.floor(containerWidth / itemWidth);
                setItemsPerPage(Math.max(1, calculatedItems));
            }
        };

        calculateItemsPerPage();
        window.addEventListener('resize', calculateItemsPerPage);
        return () => window.removeEventListener('resize', calculateItemsPerPage);
    }, []);

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

    const handleAddEmail = () => {
        if (newEmail.trim()) {
            const newAccount: EmailAccount = {
                id: Date.now().toString(),
                email: newEmail.trim(),
                provider: 'Gmail',
                isPrimary: false,
            };
            setEmailAccounts((accounts) => [...accounts, newAccount]);
            setNewEmail('');
            setShowAddEmail(false);
        }
    };

    // Check for unsaved changes
    useEffect(() => {
        const hasChanges = preferences.message !== originalPreferences.message;
        setHasUnsavedChanges(hasChanges);
    }, [preferences.message, originalPreferences.message]);

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

    // Pagination logic
    const calendarTotalPages = Math.ceil(calendarAccounts.length / itemsPerPage);
    const emailTotalPages = Math.ceil(emailAccounts.length / itemsPerPage);

    const paginatedCalendarAccounts = calendarAccounts.slice(
        calendarPage * itemsPerPage,
        (calendarPage + 1) * itemsPerPage,
    );

    const paginatedEmailAccounts = emailAccounts.slice(
        emailPage * itemsPerPage,
        (emailPage + 1) * itemsPerPage,
    );

    const handleCalendarPrevious = () => {
        setCalendarPage((prev) => Math.max(0, prev - 1));
    };

    const handleCalendarNext = () => {
        setCalendarPage((prev) => Math.min(calendarTotalPages - 1, prev + 1));
    };

    const handleEmailPrevious = () => {
        setEmailPage((prev) => Math.max(0, prev - 1));
    };

    const handleEmailNext = () => {
        setEmailPage((prev) => Math.min(emailTotalPages - 1, prev + 1));
    };

    return (
        <div className="min-h-screen bg-white flex">
            <div className="flex max-w-7xl mx-auto w-full">
                {/* Sidebar */}
                <div className="w-64 bg-white min-h-screen flex-shrink-0 flex flex-col">
                    <div className="px-6 py-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Cruso</h1>
                    </div>
                    <nav className="px-6 space-y-1 mt-6 flex-1">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">
                            Scheduling
                        </div>
                        <button
                            onClick={() => setActiveView('preferences')}
                            className={`w-full text-left px-0 py-2 text-sm font-medium transition-colors ${
                                activeView === 'preferences'
                                    ? 'text-gray-900'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Preferences
                        </button>
                        <button
                            onClick={() => setActiveView('accounts')}
                            className={`w-full text-left px-0 py-2 text-sm font-medium transition-colors ${
                                activeView === 'accounts'
                                    ? 'text-gray-900'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Accounts
                        </button>
                    </nav>

                    {/* Avatar at bottom */}
                    <div className="px-6 py-4 border-t border-gray-100 mt-auto">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg transition-colors w-full">
                                    <BoringAvatar
                                        name="Olivia Martin"
                                        colors={[
                                            '#dbeafe',
                                            '#bfdbfe',
                                            '#93c5fd',
                                            '#3b82f6',
                                            '#1d4ed8',
                                        ]}
                                        variant="beam"
                                        size={32}
                                    />
                                    <div className="text-sm text-left flex-1">
                                        <div className="font-semibold text-gray-900">
                                            Olivia Martin
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            olivia.martin@email.com
                                        </div>
                                    </div>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="bg-white border border-gray-200 shadow-lg w-56"
                            >
                                <DropdownMenuItem className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                                    <HelpCircle className="h-4 w-4 mr-2" />
                                    Support
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-200" />
                                <DropdownMenuItem className="text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer">
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

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
                                {/* Calendar Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900">
                                                Calendar
                                            </h2>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Manage your calendars
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={handleCalendarPrevious}
                                                disabled={calendarPage === 0}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={handleCalendarNext}
                                                disabled={calendarPage >= calendarTotalPages - 1}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="bg-white border border-gray-200 shadow-lg"
                                                >
                                                    <DropdownMenuItem className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Add Calendar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Paginated Calendar Layout */}
                                    <div ref={calendarContainerRef} className="overflow-hidden">
                                        <div
                                            className="flex space-x-8 transition-transform duration-300 ease-in-out"
                                            style={{ transform: `translateX(0)` }}
                                        >
                                            {paginatedCalendarAccounts.map((account) => (
                                                <div
                                                    key={account.id}
                                                    className="flex-shrink-0 w-80 min-w-80 space-y-4"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                                                                <GoogleCalendarIcon className="w-8 h-8" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-semibold text-gray-900 truncate">
                                                                    {account.email}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {account.provider}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start space-x-3 flex-shrink-0 ml-4">
                                                            {account.isPrimary && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="bg-gray-100 text-gray-700 border-0 whitespace-nowrap"
                                                                >
                                                                    Primary
                                                                </Badge>
                                                            )}
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 flex-shrink-0"
                                                                    >
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent
                                                                    align="end"
                                                                    className="bg-white border border-gray-200 shadow-lg"
                                                                >
                                                                    {!account.isPrimary && (
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                handleMakePrimaryCalendar(
                                                                                    account.id,
                                                                                )
                                                                            }
                                                                            className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer"
                                                                        >
                                                                            <Star className="h-4 w-4 mr-2" />
                                                                            Make Primary
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            handleRemoveCalendar(
                                                                                account.id,
                                                                            )
                                                                        }
                                                                        className="text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Remove
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        {account.calendars.map((calendar) => (
                                                            <div
                                                                key={calendar.name}
                                                                className="flex items-center space-x-3"
                                                            >
                                                                <Checkbox
                                                                    id={`${account.id}-${calendar.name}`}
                                                                    checked={calendar.enabled}
                                                                    onCheckedChange={() =>
                                                                        handleCalendarToggle(
                                                                            account.id,
                                                                            calendar.name,
                                                                        )
                                                                    }
                                                                />
                                                                <Label
                                                                    htmlFor={`${account.id}-${calendar.name}`}
                                                                    className="text-sm font-medium text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                                >
                                                                    {calendar.name}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Inbox Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900">
                                                Inbox
                                            </h2>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Manage your email
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={handleEmailPrevious}
                                                disabled={emailPage === 0}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={handleEmailNext}
                                                disabled={emailPage >= emailTotalPages - 1}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="bg-white border border-gray-200 shadow-lg"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() => setShowAddEmail(true)}
                                                        className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer"
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Add Email
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {showAddEmail && (
                                        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg mb-6">
                                            <Input
                                                placeholder="Enter email address"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                onKeyPress={(e) =>
                                                    e.key === 'Enter' && handleAddEmail()
                                                }
                                                className="border-0 bg-white shadow-none focus-visible:ring-1"
                                            />
                                            <Button
                                                onClick={handleAddEmail}
                                                size="sm"
                                                variant="ghost"
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                Add
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setShowAddEmail(false);
                                                    setNewEmail('');
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    )}

                                    {/* Paginated Email Layout */}
                                    <div ref={emailContainerRef} className="overflow-hidden">
                                        <div
                                            className="flex space-x-8 transition-transform duration-300 ease-in-out"
                                            style={{ transform: `translateX(0)` }}
                                        >
                                            {paginatedEmailAccounts.map((account) => (
                                                <div
                                                    key={account.id}
                                                    className="flex-shrink-0 w-80 min-w-80"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                                                                <EmailIcon className="w-8 h-8" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-semibold text-gray-900 truncate">
                                                                    {account.email}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {account.provider}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-start space-x-3 flex-shrink-0 ml-4">
                                                            {account.isPrimary && (
                                                                <Badge
                                                                    variant="secondary"
                                                                    className="bg-gray-100 text-gray-700 border-0 whitespace-nowrap"
                                                                >
                                                                    Primary
                                                                </Badge>
                                                            )}
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 flex-shrink-0"
                                                                    >
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent
                                                                    align="end"
                                                                    className="bg-white border border-gray-200 shadow-lg"
                                                                >
                                                                    {!account.isPrimary && (
                                                                        <DropdownMenuItem
                                                                            onClick={() =>
                                                                                handleMakePrimaryEmail(
                                                                                    account.id,
                                                                                )
                                                                            }
                                                                            className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer"
                                                                        >
                                                                            <Star className="h-4 w-4 mr-2" />
                                                                            Make Primary
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            handleRemoveEmail(
                                                                                account.id,
                                                                            )
                                                                        }
                                                                        className="text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Remove
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeView === 'preferences' && (
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            Preference
                                        </h2>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Manage your scheduling preference
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {hasUnsavedChanges && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleResetPreferences}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                Reset
                                            </Button>
                                        )}
                                        {hasUnsavedChanges && (
                                            <Button
                                                className="bg-black text-white hover:bg-gray-800"
                                                onClick={handleSavePreferences}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? 'Saving...' : 'Save'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Textarea
                                        placeholder="Type your message here."
                                        value={preferences.message}
                                        onChange={(e) =>
                                            setPreferences((prev) => ({
                                                ...prev,
                                                message: e.target.value,
                                            }))
                                        }
                                        className="min-h-[400px] resize-none border-0 bg-gray-50 shadow-none focus-visible:ring-1 text-base"
                                    />
                                    <div className="flex items-center justify-between text-sm text-gray-500">
                                        <span>{preferences.message.length} characters</span>
                                        <span>
                                            {
                                                preferences.message
                                                    .split(/\s+/)
                                                    .filter((word) => word.length > 0).length
                                            }{' '}
                                            words
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
