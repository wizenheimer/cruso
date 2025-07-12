'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Plus, Trash2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmailIcon } from '@/components/icons/email-icon';

import { EmailAccount } from './types';

interface InboxSectionProps {
    emailAccounts: EmailAccount[];
    onMakePrimary: (accountId: number) => void;
    onRemove: (accountId: number) => void;
    onAddEmail: (email: string) => void;
}

export function InboxSection({
    emailAccounts,
    onMakePrimary,
    onRemove,
    onAddEmail,
}: InboxSectionProps) {
    const [showAddEmail, setShowAddEmail] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [emailPage, setEmailPage] = useState(0);
    const itemsPerPage = 2;

    const handleAddEmail = () => {
        if (newEmail.trim()) {
            onAddEmail(newEmail.trim());
            setNewEmail('');
            setShowAddEmail(false);
        }
    };

    // Pagination logic
    const emailTotalPages = Math.ceil(emailAccounts.length / itemsPerPage);
    const paginatedEmailAccounts = emailAccounts.slice(
        emailPage * itemsPerPage,
        (emailPage + 1) * itemsPerPage,
    );

    const handleEmailPrevious = () => {
        setEmailPage((prev) => Math.max(0, prev - 1));
    };

    const handleEmailNext = () => {
        setEmailPage((prev) => Math.min(emailTotalPages - 1, prev + 1));
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Inbox</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage your email</p>
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
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 p-4 bg-gray-50 rounded-lg mb-6">
                    <Input
                        placeholder="Enter email address"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                        className="border-0 bg-white shadow-none focus-visible:ring-1 flex-1"
                    />
                    <div className="flex space-x-2">
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
                </div>
            )}

            {/* Paginated Email Layout */}
            <div className="overflow-hidden">
                <div
                    className="flex space-x-4 sm:space-x-6 lg:space-x-8 transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(0)` }}
                >
                    {paginatedEmailAccounts.map((account) => (
                        <div key={account.id} className="flex-shrink-0 w-full sm:w-80 sm:min-w-80">
                            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                                <div className="flex items-center justify-between space-y-3 sm:space-y-0">
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
                                    <div className="flex items-center space-x-3 flex-shrink-0">
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
                                                        onClick={() => onMakePrimary(account.id)}
                                                        className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer"
                                                    >
                                                        <Star className="h-4 w-4 mr-2" />
                                                        Make Primary
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => onRemove(account.id)}
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
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
