'use client';

import BoringAvatar from 'boring-avatars';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, HelpCircle, X } from 'lucide-react';
import { authClient } from '@/client/auth';
import { AVATAR_COLORS, AVATAR_VARIANT } from '@/constants/palette';
import { showToast } from '@/lib/toast';

interface SidebarProps {
    activeView: 'preferences' | 'accounts' | 'getting-started';
    onViewChange: (view: 'preferences' | 'accounts' | 'getting-started') => void;
    onClose?: () => void;
}

// Common dropdown menu content
function UserDropdownMenu({ onSignOut }: { onSignOut: () => void }) {
    return (
        <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg w-56">
            <DropdownMenuItem className="hover:bg-gray-50 focus:bg-gray-50 cursor-pointer">
                <HelpCircle className="h-4 w-4 mr-2" />
                Support
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200" />
            <DropdownMenuItem
                className="text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer"
                onClick={onSignOut}
            >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
            </DropdownMenuItem>
        </DropdownMenuContent>
    );
}

// Separate Avatar component for mobile use
export function Avatar() {
    const { data: session } = authClient.useSession();

    const handleSignOut = async () => {
        try {
            await authClient.signOut();
            window.location.href = '/login';
        } catch (error) {
            console.error('Error signing out:', error);
            showToast.error('Failed to sign out. Please try again.');
        }
    };

    const userName = session?.user?.name || 'Anonymous User';
    const userEmail = session?.user?.email || 'user@example.com';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg transition-colors w-full p-2">
                    <BoringAvatar
                        name={userName}
                        colors={AVATAR_COLORS}
                        variant={AVATAR_VARIANT}
                        size={32}
                    />
                    <div className="text-sm text-left flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{userName}</div>
                        <div className="text-sm text-gray-600 truncate">{userEmail}</div>
                    </div>
                </button>
            </DropdownMenuTrigger>
            <UserDropdownMenu onSignOut={handleSignOut} />
        </DropdownMenu>
    );
}

// Mobile-only Avatar component (smaller, no text)
export function MobileAvatar() {
    const { data: session } = authClient.useSession();

    const handleSignOut = async () => {
        try {
            await authClient.signOut();
            window.location.href = '/login';
        } catch (error) {
            console.error('Error signing out:', error);
            showToast.error('Failed to sign out. Please try again.');
        }
    };

    const userName = session?.user?.name || 'Anonymous User';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex items-center hover:bg-gray-50 rounded-lg transition-colors p-1">
                    <BoringAvatar
                        name={userName}
                        colors={AVATAR_COLORS}
                        variant={AVATAR_VARIANT}
                        size={32}
                    />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="bg-white border border-gray-200 shadow-lg w-48"
            >
                <UserDropdownMenu onSignOut={handleSignOut} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function Sidebar({ activeView, onViewChange, onClose }: SidebarProps) {
    return (
        <div className="w-64 md:w-64 bg-white h-screen flex-shrink-0 flex flex-col shadow-lg md:shadow-none">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <h1 className="text-xl font-semibold text-gray-900">Cruso</h1>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Desktop Header */}
            <div className="hidden md:block px-6 py-6 flex-shrink-0">
                <h1 className="text-2xl font-semibold text-gray-900">Cruso</h1>
            </div>

            {/* Navigation - takes up available space */}
            <div className="flex-1 overflow-y-auto">
                <nav className="px-6 space-y-1 mt-6">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">
                        Scheduling
                    </div>
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
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6 mt-8">
                        Explore
                    </div>
                    <button
                        onClick={() => onViewChange('getting-started')}
                        className={`w-full text-left px-0 py-2 text-sm font-medium transition-colors ${
                            activeView === 'getting-started'
                                ? 'text-gray-900'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        Scheduling
                    </button>
                </nav>
            </div>

            {/* Avatar at bottom - will stick to bottom */}
            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
                <Avatar />
            </div>
        </div>
    );
}
