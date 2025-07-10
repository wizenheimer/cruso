'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RotateCcw } from 'lucide-react';

import { Preferences } from './types';

interface PreferencesViewProps {
    preferences: Preferences;
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    onPreferencesChange: (preferences: Preferences) => void;
    onSave: () => void;
    onReset: () => void;
}

export function PreferencesView({
    preferences,
    isSaving,
    hasUnsavedChanges,
    onPreferencesChange,
    onSave,
    onReset,
}: PreferencesViewProps) {
    return (
        <div className="mt-4 md:mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Preference</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage your scheduling preference</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    {hasUnsavedChanges && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                        </Button>
                    )}
                    {hasUnsavedChanges && (
                        <Button
                            className="bg-black text-white hover:bg-gray-800"
                            onClick={onSave}
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
                        onPreferencesChange({
                            ...preferences,
                            message: e.target.value,
                        })
                    }
                    className="min-h-[300px] md:min-h-[400px] resize-none border-0 bg-gray-50 shadow-none focus-visible:ring-1 text-base"
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 space-y-1 sm:space-y-0">
                    <span>{preferences.message.length} characters</span>
                    <span>
                        {preferences.message.split(/\s+/).filter((word) => word.length > 0).length}{' '}
                        words
                    </span>
                </div>
            </div>
        </div>
    );
}
