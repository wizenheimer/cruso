'use client';

import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';

interface NextButtonProps {
    onClick: () => void;
    loading?: boolean;
    isLastStep?: boolean;
    disabled?: boolean;
}

export const NextButton = ({
    onClick,
    loading = false,
    isLastStep = false,
    disabled = false,
}: NextButtonProps) => {
    return (
        <Button
            onClick={onClick}
            disabled={disabled || loading}
            className="h-9 px-4 text-sm font-medium bg-black text-white hover:bg-gray-800 disabled:bg-gray-400 flex items-center gap-2"
        >
            {loading ? (
                <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                </>
            ) : isLastStep ? (
                <>
                    <span>Dashboard</span>
                    <ArrowUpRight className="w-4 h-4" />
                </>
            ) : (
                <>
                    <span>Next</span>
                    <span className="text-xs opacity-60">⌘↵</span>
                </>
            )}
        </Button>
    );
};
