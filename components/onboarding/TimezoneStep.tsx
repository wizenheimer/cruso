'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TimezoneStepProps {
    timezone: string;
    onUpdateTimezone: (timezone: string) => void;
}

const TimezoneStep = ({ timezone, onUpdateTimezone }: TimezoneStepProps) => {
    const [inputValue, setInputValue] = useState(timezone);

    const handleInputChange = (value: string) => {
        setInputValue(value);
        onUpdateTimezone(value);
    };

    return (
        <>
            <h1 className="text-2xl font-semibold mb-2 text-center">Your Timezone</h1>
            <p className="text-base text-muted-foreground mb-8 text-center">
                Set your preferred timezone for scheduling meetings
            </p>

            {/* Timezone Configuration */}
            <div className="w-full mb-4">
                <div className="space-y-6">
                    {/* Timezone Input */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="timezone-input"
                            className="text-sm font-medium text-gray-700"
                        >
                            Describe your timezone
                        </Label>
                        <Input
                            id="timezone-input"
                            type="text"
                            placeholder="Enter your timezone (e.g., America/New_York)"
                            value={inputValue}
                            onChange={(e) => handleInputChange(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default TimezoneStep;
