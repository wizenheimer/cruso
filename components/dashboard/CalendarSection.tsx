'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Plus, Trash2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { GoogleCalendarIcon } from '@/components/icons/calendar-icon';

import { CalendarAccount } from './types';

interface CalendarSectionProps {
    calendarAccounts: CalendarAccount[];
    onMakePrimary: (accountId: string) => void;
    onRemove: (accountId: string) => void;
    onCalendarToggle: (accountId: string, calendarName: string) => void;
}

export function CalendarSection({
    calendarAccounts,
    onMakePrimary,
    onRemove,
    onCalendarToggle,
}: CalendarSectionProps) {
    const [calendarPage, setCalendarPage] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(2);
    const calendarContainerRef = useRef<HTMLDivElement>(null);

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

    // Pagination logic
    const calendarTotalPages = Math.ceil(calendarAccounts.length / itemsPerPage);
    const paginatedCalendarAccounts = calendarAccounts.slice(
        calendarPage * itemsPerPage,
        (calendarPage + 1) * itemsPerPage,
    );

    const handleCalendarPrevious = () => {
        setCalendarPage((prev) => Math.max(0, prev - 1));
    };

    const handleCalendarNext = () => {
        setCalendarPage((prev) => Math.min(calendarTotalPages - 1, prev + 1));
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Calendar</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage your calendars</p>
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
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                        <div key={account.id} className="flex-shrink-0 w-80 min-w-80 space-y-4">
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
                                                onCalendarToggle(account.id, calendar.name)
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
    );
}
