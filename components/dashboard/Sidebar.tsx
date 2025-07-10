'use client';

import BoringAvatar from 'boring-avatars';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, HelpCircle } from 'lucide-react';

interface SidebarProps {
    activeView: 'preferences' | 'accounts';
    onViewChange: (view: 'preferences' | 'accounts') => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
    return (
        <div className="w-64 bg-white min-h-screen flex-shrink-0 flex flex-col">
            <div className="px-6 py-6">
                <h1 className="text-2xl font-semibold text-gray-900">Cruso</h1>
            </div>
            <nav className="px-6 space-y-1 mt-6 flex-1">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">
                    Scheduling
                </div>
                <button
                    onClick={() => onViewChange('preferences')}
                    className={`w-full text-left px-0 py-2 text-sm font-medium transition-colors ${
                        activeView === 'preferences'
                            ? 'text-gray-900'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                    Preferences
                </button>
                <button
                    onClick={() => onViewChange('accounts')}
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
                                colors={['#dbeafe', '#bfdbfe', '#93c5fd', '#3b82f6', '#1d4ed8']}
                                variant="beam"
                                size={32}
                            />
                            <div className="text-sm text-left flex-1">
                                <div className="font-semibold text-gray-900">Olivia Martin</div>
                                <div className="text-sm text-gray-600">olivia.martin@email.com</div>
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
    );
}
